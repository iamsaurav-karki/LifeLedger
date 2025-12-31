import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Post('users')
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  createUser(@Request() req, @Body() createDto: CreateUserDto) {
    return this.adminService.createUser(req.user.id, createDto, req.ip);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  findAllUsers(@Query('search') search?: string, @Query('status') status?: string) {
    return this.adminService.findAllUsers(search, status as any);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user with metrics' })
  getUserMetrics(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserMetrics(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(req.user.id, id, updateDto, req.ip);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  deleteUser(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(req.user.id, id, req.ip);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  resetPassword(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.adminService.resetUserPassword(req.user.id, id, resetPasswordDto.newPassword, req.ip);
  }

  // Platform Analytics
  @Get('analytics')
  @ApiOperation({ summary: 'Get platform-wide analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getPlatformAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPlatformAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Categories Management
  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() createDto: CreateCategoryDto) {
    return this.adminService.createCategory(createDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'type', required: false, enum: ['expense', 'food', 'investment'] })
  findAllCategories(@Query('type') type?: string) {
    return this.adminService.findAllCategories(type as any);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, updateDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteCategory(id);
  }

  // System Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get system setting by key' })
  getSystemSetting(@Param('key') key: string) {
    return this.adminService.getSystemSetting(key);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update system setting' })
  updateSystemSetting(
    @Request() req,
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemSettingDto,
  ) {
    return this.adminService.updateSystemSetting(req.user.id, key, updateDto, req.ip);
  }

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAuditLogs(@Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(limit);
  }
}

