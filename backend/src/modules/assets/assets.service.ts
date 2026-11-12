import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { AssetStatus, AssetType } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filters?: { status?: AssetStatus; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { assetTag: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.asset.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
        tickets: {
          where: { status: { notIn: ['CLOSED', 'CANCELLED'] } },
          select: { id: true, ticketNumber: true, title: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findMyAndShared(userId: string) {
    return this.prisma.asset.findMany({
      where: {
        status: { not: AssetStatus.RETIRED },
        OR: [{ assignedToId: userId }, { assignedToId: null }],
      },
      orderBy: [{ assignedToId: 'desc' }, { assetTag: 'asc' }],
    });
  }

  async create(dto: CreateAssetDto, actor: any) {
    const tag = dto.assetTag.trim().toUpperCase();
    const existing = await this.prisma.asset.findUnique({ where: { assetTag: tag } });
    if (existing) {
      throw new ConflictException(`Asset tag '${tag}' already exists`);
    }

    const created = await this.prisma.asset.create({
      data: {
        assetTag: tag,
        name: dto.name.trim(),
        assetType: dto.assetType || AssetType.LAPTOP,
        serialNumber: dto.serialNumber?.trim() || null,
        location: dto.location?.trim() || null,
        status: dto.status || AssetStatus.IN_SERVICE,
        assignedToId: dto.assignedToId || null,
        warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    void this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: `${actor.firstName} ${actor.lastName}`,
      action: 'asset.create',
      module: 'assets',
      resourceType: 'Asset',
      resourceId: created.assetTag,
      afterState: { name: created.name, status: created.status, assignedToId: created.assignedToId },
    });

    return created;
  }

  async update(id: string, dto: UpdateAssetDto, actor: any) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Asset '${id}' not found`);

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.assetType !== undefined ? { assetType: dto.assetType } : {}),
        ...(dto.serialNumber !== undefined ? { serialNumber: dto.serialNumber || null } : {}),
        ...(dto.location !== undefined ? { location: dto.location || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId || null } : {}),
        ...(dto.warrantyUntil !== undefined
          ? { warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: {
          where: { status: { notIn: ['CLOSED', 'CANCELLED'] } },
          select: { id: true, ticketNumber: true, title: true, status: true },
        },
      },
    });

    void this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: `${actor.firstName} ${actor.lastName}`,
      action: 'asset.update',
      module: 'assets',
      resourceType: 'Asset',
      resourceId: updated.assetTag,
      beforeState: { status: existing.status, assignedToId: existing.assignedToId },
      afterState: { status: updated.status, assignedToId: updated.assignedToId },
    });

    return updated;
  }
}

