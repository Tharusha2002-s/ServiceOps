import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/password-reset.dto';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { RoleName, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurationMinutes = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Hashes a raw refresh token using SHA-256 before database lookup / storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validates user credentials with Argon2id and enforces account lockout (BR-001).
   */
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.LOCKED) {
      throw new UnauthorizedException(`Account is currently ${user.status.toLowerCase()}. Contact your administrator.`);
    }

    // Check Lockout Status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new UnauthorizedException(
        `Account locked due to consecutive failed attempts. Retry in ${remainingMinutes} minutes.`,
      );
    }

    // Verify Password with Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, pass);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;
      let newStatus = user.status;

      if (attempts >= this.maxFailedAttempts) {
        lockoutDate = new Date(Date.now() + this.lockoutDurationMinutes * 60 * 1000);
        newStatus = UserStatus.LOCKED;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil: lockoutDate,
          status: newStatus,
        },
      });

      if (attempts >= this.maxFailedAttempts) {
        await this.auditService.record({
          actorId: user.id,
          actorEmail: user.email,
          actorName: 'System (Security)',
          action: 'auth.lock',
          module: 'auth',
          resourceType: 'User',
          resourceId: user.email,
          afterState: { status: UserStatus.LOCKED, failedLoginAttempts: attempts },
        });
        throw new UnauthorizedException(
          `Account locked for ${this.lockoutDurationMinutes} minutes due to ${this.maxFailedAttempts} failed login attempts.`,
        );
      }

      throw new UnauthorizedException(`Invalid credentials. ${this.maxFailedAttempts - attempts} attempts remaining before temporary lockout.`);
    }

    // Reset failed attempts upon successful password verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
      },
    });

    // Compile roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      jobTitle: user.jobTitle,
      roles,
      permissions: Array.from(permissionsSet),
    };
  }

  /**
   * Generates Dual Tokens: Short-lived Access Token + Cryptographic Refresh Token with Rotation.
   */
  async login(user: any, ipAddress?: string, userAgent?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      jti: crypto.randomUUID(),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') || '15m',
    });

    // Generate cryptographic 256-bit random refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const family = crypto.randomUUID();

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        family,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    await this.auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorName: `${user.firstName} ${user.lastName}`,
      action: 'auth.login',
      module: 'auth',
      resourceType: 'Session',
      resourceId: user.email,
      ipAddress,
      afterState: { roles: user.roles },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user,
    };
  }

  /**
   * Refresh token rotation: Invalidates presented token and issues a new pair.
   * If a revoked token is reused, all tokens in the family are purged (theft detection).
   */
  async refreshTokens(rawToken: string, ipAddress?: string, userAgent?: string) {
    if (!rawToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token Reuse / Breach Detection
    if (tokenRecord.isRevoked) {
      // Invalidate all tokens in this family immediately!
      await this.prisma.refreshToken.updateMany({
        where: { family: tokenRecord.family },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Security Alert: Refresh token reuse detected. All active sessions have been terminated.');
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired. Please log in again.');
    }

    const user = tokenRecord.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is no longer active.');
    }

    // Revoke current refresh token (single-use rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Generate new Access Token
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      jti: crypto.randomUUID(),
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') || '15m',
    });

    // Generate new Rotated Refresh Token in same family
    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        family: tokenRecord.family, // Maintain family lineage
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      jobTitle: user.jobTitle,
      roles,
      permissions: Array.from(permissionsSet),
    };

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: sanitizedUser,
    };
  }

  /**
   * Logs out user by revoking the refresh token.
   */
  async logout(rawToken: string) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Self-registration endpoint strictly enforcing EMPLOYEE role (BR-001).
   */
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`An account with email '${email}' already exists`);
    }

    const employeeRole = await this.prisma.role.findUnique({
      where: { name: RoleName.EMPLOYEE },
    });
    if (!employeeRole) {
      throw new BadRequestException('Default EMPLOYEE role is not provisioned');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        department: dto.department?.trim() || 'General Operations',
        jobTitle: dto.jobTitle?.trim() || 'Employee',
        status: UserStatus.ACTIVE,
        userRoles: {
          create: {
            roleId: employeeRole.id,
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      jobTitle: user.jobTitle,
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }

  /**
   * Issues a single-use cryptographic password reset token without leaking email existence (FR-AUTH-008).
   */
  async requestPasswordReset(email: string) {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    if (user && user.status !== UserStatus.DEACTIVATED) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            tokenHash,
            userId: user.id,
            expiresAt,
          },
        }),
      ]);

      if (this.configService.get<string>('nodeEnv') !== 'production') {
        this.logger.log(
          `[DEV PASSWORD RESET] Issued single-use reset token for ${normalized}: ${rawToken}`,
        );
      }
    }

    return {
      message: 'If an active account exists for that email, reset instructions have been issued.',
    };
  }

  /**
   * Consumes single-use reset token, updates passwordHash with Argon2id, unlocks account & revokes active sessions.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token.trim());
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (
      record.user.status === UserStatus.DEACTIVATED ||
      record.user.status === UserStatus.SUSPENDED
    ) {
      throw new UnauthorizedException('Account cannot reset password in its current state');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return {
      message: 'Password reset successful. Please sign in with your new password.',
    };
  }
}
