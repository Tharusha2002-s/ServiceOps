import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto, UpdateKnowledgeDto } from './dto/knowledge.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { KnowledgeStatus, RoleName } from '@prisma/client';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  @Permissions('kb:read')
  @ApiOperation({ summary: 'Search or list knowledge articles (published only for employees)' })
  async findAll(
    @Request() req: any,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: KnowledgeStatus,
    @Query('limit') limit?: string,
  ) {
    const data = await this.knowledgeService.findAll(req.user, {
      q,
      categoryId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { statusCode: HttpStatus.OK, data };
  }

  @Get(':id')
  @Permissions('kb:read')
  @ApiOperation({ summary: 'Read full knowledge article content & record view count' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const data = await this.knowledgeService.findOne(id, req.user);
    return { statusCode: HttpStatus.OK, data };
  }

  @Post()
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('kb:manage')
  @ApiOperation({ summary: 'Author a new knowledge article (Staff only)' })
  async create(@Body() dto: CreateKnowledgeDto, @Request() req: any) {
    const data = await this.knowledgeService.create(dto, req.user);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Knowledge article created',
      data,
    };
  }

  @Patch(':id')
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('kb:manage')
  @ApiOperation({ summary: 'Update or publish/archive a knowledge article' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDto,
    @Request() req: any,
  ) {
    const data = await this.knowledgeService.update(id, dto, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Knowledge article updated',
      data,
    };
  }

  @Post(':id/helpful')
  @Permissions('kb:read')
  @ApiOperation({ summary: 'Mark a knowledge article as helpful (deflection feedback)' })
  async markHelpful(@Param('id') id: string, @Request() req: any) {
    const data = await this.knowledgeService.markHelpful(id, req.user);
    return { statusCode: HttpStatus.OK, data };
  }
}

