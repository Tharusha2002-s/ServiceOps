import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/database/prisma.service';

@ApiTags('System Health & Probes')
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'System Health Check & Component Status' })
  async getHealth() {
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch (err) {
      dbStatus = 'degraded';
      dbLatencyMs = Date.now() - start;
    }

    return {
      status: dbStatus === 'healthy' ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      components: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        },
      },
    };
  }

  @Get('liveness')
  @Public()
  @ApiOperation({ summary: 'Kubernetes / Container Liveness Probe' })
  getLiveness() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @Public()
  @ApiOperation({ summary: 'Kubernetes / Container Readiness Probe' })
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'READY', timestamp: new Date().toISOString() };
    } catch (err) {
      return { status: 'NOT_READY', error: 'Database connection failed' };
    }
  }
}

