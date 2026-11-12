import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List ticket categories & service lines' })
  async findAll(
    @Request() req: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const canViewInactive =
      includeInactive === 'true' &&
      (req.user.roles?.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
        req.user.roles?.includes(RoleName.IT_MANAGER));

    const data = await this.categoriesService.findAll(canViewInactive);
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post()
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Create a new ticket category (Admin only)' })
  async create(@Body() dto: CreateCategoryDto, @Request() req: any) {
    const data = await this.categoriesService.create(dto, req.user);
    return {
      statusCode: HttpStatus.CREATED,
      message: `Category '${data.name}' created`,
      data,
    };
  }

  @Patch(':id')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Update or retire a ticket category (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req: any,
  ) {
    const data = await this.categoriesService.update(id, dto, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: `Category '${data.name}' updated`,
      data,
    };
  }
}

