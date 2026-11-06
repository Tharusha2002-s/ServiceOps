import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict' depending on cross-origin setup
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enterprise User Login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access token and profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await this.authService.login(user, ipAddress, userAgent);

    // Set secure HttpOnly cookie for Refresh Token
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        user: tokens.user,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate Refresh Token & Issue New Access Token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid, revoked, or expired refresh token' })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read from HttpOnly cookie first, fallback to request body
    const rawToken = req.cookies?.refreshToken || body.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshTokens(rawToken, ipAddress, userAgent);

    // Rotate the cookie with new cryptographic refresh token
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      statusCode: HttpStatus.OK,
      message: 'Token rotated successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active refresh token session and clear cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and granted permissions' })
  async getProfile(@CurrentUser() user: any) {
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }
}

