import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { TicketsService, UploadedTicketFile } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RoleName, TicketStatus, TicketPriority } from '@prisma/client';

@ApiTags('Ticket Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all IT service categories' })
  async getCategories() {
    const categories = await this.ticketsService.getCategories();
    return {
      statusCode: HttpStatus.OK,
      data: categories,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List service tickets (Scoped by requester/role)' })
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('categoryId') categoryId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('unassigned') unassigned?: string,
  ) {
    const isUnassigned = unassigned === 'true' || unassigned === '1';
    const tickets = await this.ticketsService.findAllTickets(user, {
      status,
      priority,
      categoryId,
      assigneeId,
      unassigned: isUnassigned,
    });
    return {
      statusCode: HttpStatus.OK,
      data: tickets,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single ticket details with discussion history' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const ticket = await this.ticketsService.findTicketById(id, user);
    return {
      statusCode: HttpStatus.OK,
      data: ticket,
    };
  }

  @Post()
  @Permissions('ticket:create')
  @ApiOperation({ summary: 'Submit a new service ticket with automated ITIL priority calculation' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser('id') userId: string) {
    const ticket = await this.ticketsService.createTicket(createTicketDto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Service request created successfully',
      data: ticket,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition ticket lifecycle state (Enforces requester confirm-close per BR-012)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
    @CurrentUser() user: any,
  ) {
    const updated = await this.ticketsService.updateTicketStatus(id, updateStatusDto, user);
    return {
      statusCode: HttpStatus.OK,
      message: `Ticket status transitioned to ${updateStatusDto.status}`,
      data: updated,
    };
  }

  @Patch(':id/assign')
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Assign ticket to an IT Support Agent' })
  async assign(
    @Param('id') id: string,
    @Body() assignDto: AssignTicketDto,
    @CurrentUser() user: any,
  ) {
    const updated = await this.ticketsService.assignTicket(id, assignDto.assigneeId, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ticket assigned successfully',
      data: updated,
    };
  }

  @Patch(':id/asset')
  @ApiOperation({ summary: 'Link or unlink an IT CMDB Asset on a ticket' })
  async linkAsset(
    @Param('id') id: string,
    @Body('assetId') assetId: string | null,
    @CurrentUser() user: any,
  ) {
    const updated = await this.ticketsService.linkAsset(id, assetId || null, user);
    return {
      statusCode: HttpStatus.OK,
      message: assetId ? 'Asset linked to ticket' : 'Asset unlinked from ticket',
      data: updated,
    };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a customer response or agent internal note' })
  async addComment(
    @Param('id') id: string,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    const comment = await this.ticketsService.addComment(id, addCommentDto, user);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Comment posted successfully',
      data: comment,
    };
  }

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload up to 3 validated file attachments onto a service ticket' })
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: UploadedTicketFile[],
    @CurrentUser() user: any,
  ) {
    const uploaded = await this.ticketsService.addAttachments(id, files, user);
    return {
      statusCode: HttpStatus.CREATED,
      message: `${uploaded.length} attachment(s) uploaded successfully`,
      data: uploaded,
    };
  }

  @Get(':id/attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Authorized download of a ticket attachment' })
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { attachment, resolvedPath } = await this.ticketsService.getAttachmentForDownload(
      id,
      attachmentId,
      user,
    );

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      'X-Content-Type-Options': 'nosniff',
    });

    const stream = fs.createReadStream(resolvedPath);
    return new StreamableFile(stream);
  }
}

