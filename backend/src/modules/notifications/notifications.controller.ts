import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve in-app notifications & unread badge count for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findMine(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.notificationsService.findMyNotifications(
      req.user.id,
      unreadOnly === 'true',
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all unread notifications as read for current user' })
  async markAllAsRead(@Request() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'All notifications marked as read',
      data: result,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const notification = await this.notificationsService.markAsRead(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      data: notification,
    };
  }

  @Get('deliveries')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Inspect recent IN_APP and async EMAIL delivery audit records' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDeliveryLogs(@Query('limit') limit?: string) {
    const data = await this.notificationsService.getDeliveryLogs(limit ? parseInt(limit, 10) : 50);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }
}

