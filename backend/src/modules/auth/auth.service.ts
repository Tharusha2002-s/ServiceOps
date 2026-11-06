import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurationMinutes = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
}
