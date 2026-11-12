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
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { AssetStatus, RoleName } from '@prisma/client';

@ApiTags('IT Assets CMDB')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('my')
  @ApiOperation({ summary: 'List assets assigned to current employee or shared office hardware' })
  async findMy(@Request() req: any) {
    const data = await this.assetsService.findMyAndShared(req.user.id);
    return { statusCode: HttpStatus.OK, data };
  }

  @Get()
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('asset:read')
  @ApiOperation({ summary: 'List organizational IT asset CMDB inventory' })
  async findAll(
    @Query('status') status?: AssetStatus,
    @Query('search') search?: string,
  ) {
    const data = await this.assetsService.findAll({ status, search });
    return { statusCode: HttpStatus.OK, data };
  }

  @Post()
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('asset:manage')
  @ApiOperation({ summary: 'Register a new IT hardware/license asset in CMDB' })
  async create(@Body() dto: CreateAssetDto, @Request() req: any) {
    const data = await this.assetsService.create(dto, req.user);
    return {
      statusCode: HttpStatus.CREATED,
      message: `Asset ${data.assetTag} registered`,
      data,
    };
  }

  @Patch(':id')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('asset:manage')
  @ApiOperation({ summary: 'Update IT asset lifecycle status, location, or holder' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @Request() req: any,
  ) {
    const data = await this.assetsService.update(id, dto, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: `Asset ${data.assetTag} updated`,
      data,
    };
  }
}

