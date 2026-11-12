import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { RoleName, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        jobTitle: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async create(dto: CreateUserDto, actor?: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.role} not found in system`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department,
        jobTitle: dto.jobTitle,
        status: UserStatus.ACTIVE,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: 'user.create',
      module: 'users',
      resourceType: 'User',
      resourceId: user.email,
      afterState: { email: user.email, role: dto.role, status: user.status },
    });

    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  async setUserStatus(id: string, status: UserStatus, actor?: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (actor?.id === id && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot suspend or deactivate your own administrator account.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        failedLoginAttempts: status === UserStatus.ACTIVE ? 0 : user.failedLoginAttempts,
        lockoutUntil: status === UserStatus.ACTIVE ? null : user.lockoutUntil,
      },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: status === UserStatus.ACTIVE && user.status === UserStatus.LOCKED ? 'auth.unlock' : 'user.status',
      module: 'users',
      resourceType: 'User',
      resourceId: updated.email,
      beforeState: { status: user.status },
      afterState: { status: updated.status },
    });

    return updated;
  }

  async updateUserRole(id: string, newRole: RoleName, actor?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (actor?.id === id && newRole !== RoleName.SYSTEM_ADMINISTRATOR) {
      throw new BadRequestException('You cannot downgrade your own System Administrator role.');
    }

    const targetRole = await this.prisma.role.findUnique({ where: { name: newRole } });
    if (!targetRole) {
      throw new NotFoundException(`Role ${newRole} not found`);
    }

    const prevRoles = user.userRoles.map((ur) => ur.role.name);

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.create({
        data: { userId: id, roleId: targetRole.id },
      });
    });

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: 'role.grant',
      module: 'users',
      resourceType: 'User',
      resourceId: user.email,
      beforeState: { roles: prevRoles },
      afterState: { roles: [newRole] },
    });

    return this.findById(id);
  }
}

