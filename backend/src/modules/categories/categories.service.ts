import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { TicketPriority } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: { select: { tickets: true } },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto, actor: any) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ code }, { name: dto.name.trim() }],
      },
    });
    if (existing) {
      throw new ConflictException(`Category '${dto.name}' (${code}) already exists.`);
    }

    const created = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        code,
        description: dto.description?.trim() || null,
        icon: dto.icon || '📁',
        defaultPriority: dto.defaultPriority || TicketPriority.MEDIUM_P3,
        subcategories: dto.subcategories || [],
        isActive: true,
      },
      include: { _count: { select: { tickets: true } } },
    });

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: 'category.create',
      module: 'categories',
      resourceType: 'Category',
      resourceId: created.code,
      afterState: { name: created.name, code: created.code, defaultPriority: created.defaultPriority },
    });

    return created;
  }

  async update(id: string, dto: UpdateCategoryDto, actor: any) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category '${id}' not found`);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.defaultPriority !== undefined ? { defaultPriority: dto.defaultPriority } : {}),
        ...(dto.subcategories !== undefined ? { subcategories: dto.subcategories } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { _count: { select: { tickets: true } } },
    });

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: dto.isActive === false ? 'category.retire' : 'category.update',
      module: 'categories',
      resourceType: 'Category',
      resourceId: updated.code,
      beforeState: {
        name: existing.name,
        isActive: existing.isActive,
        defaultPriority: existing.defaultPriority,
      },
      afterState: {
        name: updated.name,
        isActive: updated.isActive,
        defaultPriority: updated.defaultPriority,
      },
    });

    return updated;
  }
}

