import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateKnowledgeDto, UpdateKnowledgeDto } from './dto/knowledge.dto';
import { KnowledgeStatus, RoleName } from '@prisma/client';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private isStaff(user: any): boolean {
    const staffRoles: RoleName[] = [
      RoleName.IT_SUPPORT_AGENT,
      RoleName.IT_MANAGER,
      RoleName.SYSTEM_ADMINISTRATOR,
    ];
    return user?.roles?.some((r: RoleName) => staffRoles.includes(r));
  }

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    return `${base || 'article'}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async findAll(
    user: any,
    filters?: { q?: string; categoryId?: string; status?: KnowledgeStatus; limit?: number },
  ) {
    const staff = this.isStaff(user);
    const where: any = {};

    if (!staff) {
      where.status = KnowledgeStatus.PUBLISHED;
    } else if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.q && filters.q.trim().length > 0) {
      const term = filters.q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
      ];
    }

    return this.prisma.knowledgeArticle.findMany({
      where,
      include: {
        category: { select: { id: true, code: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ helpfulCount: 'desc' }, { updatedAt: 'desc' }],
      take: filters?.limit ? Math.min(filters.limit, 100) : 50,
    });
  }

  async findOne(idOrSlug: string, user: any) {
    const staff = this.isStaff(user);
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        category: { select: { id: true, code: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!article) {
      throw new NotFoundException(`Knowledge article '${idOrSlug}' not found`);
    }
    if (!staff && article.status !== KnowledgeStatus.PUBLISHED) {
      throw new ForbiddenException('Only published knowledge articles are visible to employees.');
    }

    await this.prisma.knowledgeArticle.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } },
    });

    return { ...article, viewsCount: article.viewsCount + 1 };
  }

  async create(dto: CreateKnowledgeDto, actor: any) {
    const status = dto.status || KnowledgeStatus.DRAFT;
    const article = await this.prisma.knowledgeArticle.create({
      data: {
        slug: this.slugify(dto.title),
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        content: dto.content,
        categoryId: dto.categoryId || null,
        status,
        authorId: actor.id,
        readMinutes: dto.readMinutes || 3,
        tags: (dto.tags || []).map((t) => t.toLowerCase().trim()).filter(Boolean),
        publishedAt: status === KnowledgeStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        category: { select: { id: true, code: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    void this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: `${actor.firstName} ${actor.lastName}`,
      action: 'kb.create',
      module: 'knowledge',
      resourceType: 'KnowledgeArticle',
      resourceId: article.slug,
      afterState: { title: article.title, status: article.status },
    });

    return article;
  }

  async update(id: string, dto: UpdateKnowledgeDto, actor: any) {
    const existing = await this.prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Knowledge article '${id}' not found`);
    }

    const updated = await this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary?.trim() || null } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId || null } : {}),
        ...(dto.readMinutes !== undefined ? { readMinutes: dto.readMinutes } : {}),
        ...(dto.tags !== undefined
          ? { tags: dto.tags.map((t) => t.toLowerCase().trim()).filter(Boolean) }
          : {}),
        ...(dto.status !== undefined
          ? {
              status: dto.status,
              publishedAt:
                dto.status === KnowledgeStatus.PUBLISHED && !existing.publishedAt
                  ? new Date()
                  : existing.publishedAt,
            }
          : {}),
      },
      include: {
        category: { select: { id: true, code: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    void this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: `${actor.firstName} ${actor.lastName}`,
      action: 'kb.update',
      module: 'knowledge',
      resourceType: 'KnowledgeArticle',
      resourceId: updated.slug,
      beforeState: { status: existing.status, title: existing.title },
      afterState: { status: updated.status, title: updated.title },
    });

    return updated;
  }

  async markHelpful(id: string, user: any) {
    const article = await this.prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Knowledge article '${id}' not found`);
    if (!this.isStaff(user) && article.status !== KnowledgeStatus.PUBLISHED) {
      throw new ForbiddenException('Cannot rate unpublished article');
    }

    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
      select: { id: true, helpfulCount: true },
    });
  }
}
