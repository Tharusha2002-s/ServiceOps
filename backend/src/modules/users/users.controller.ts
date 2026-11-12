import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RoleName, UserStatus } from '@prisma/client';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleName.SYSTEM_ADMINISTRATOR, RoleName.IT_MANAGER)
  @ApiOperation({ summary: 'List all users in the organization (Admin / Manager only)' })
  @ApiResponse({ status: 200, description: 'User list retrieved successfully' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: users,
    };
  }

  @Get(':id')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR, RoleName.IT_MANAGER)
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  @Post()
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('user:manage')
  @ApiOperation({ summary: 'Provision a new user account with role assignment (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    const user = await this.usersService.create(createUserDto, req.user);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User provisioned successfully',
      data: user,
    };
  }

  @Patch(':id/status')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('user:manage')
  @ApiOperation({ summary: 'Update user account status (e.g. SUSPENDED, ACTIVE, LOCKED)' })
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Request() req: any,
  ) {
    const updated = await this.usersService.setUserStatus(id, status, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: `User status transitioned to ${status}`,
      data: updated,
    };
  }

  @Patch(':id/role')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('user:manage')
  @ApiOperation({ summary: 'Grant or change role for an enterprise user (Admin only)' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    const updated = await this.usersService.updateUserRole(id, dto.role, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: `User role updated to ${dto.role}`,
      data: updated,
    };
  }
}

