import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Expense } from '../../entities/expense.entity';
import { Income } from '../../entities/income.entity';
import { Investment } from '../../entities/investment.entity';
import { FoodLog } from '../../entities/food-log.entity';
import { AdminAuditLog } from '../../entities/admin-audit-log.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Category, CategoryType } from '../../entities/category.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
    @InjectRepository(FoodLog)
    private foodLogRepository: Repository<FoodLog>,
    @InjectRepository(AdminAuditLog)
    private auditLogRepository: Repository<AdminAuditLog>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // User Management
  async createUser(adminId: string, createDto: CreateUserDto, ip?: string): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({ where: { email: createDto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      name: createDto.name,
      email: createDto.email,
      passwordHash,
      role: createDto.role || UserRole.USER,
      status: createDto.status || UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    // Log admin action
    await this.createAuditLog(adminId, 'USER_CREATED', savedUser.id, ip, {
      email: savedUser.email,
      role: savedUser.role,
      status: savedUser.status,
    });

    return savedUser;
  }

  async findAllUsers(search?: string, status?: UserStatus): Promise<User[]> {
    const where: any = {};
    if (search) {
      where.email = Like(`%${search}%`);
    }
    if (status) {
      where.status = status;
    }
    return this.userRepository.find({
      where,
      select: ['id', 'name', 'email', 'role', 'status', 'lastLogin', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserMetrics(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalExpenses, totalIncome, totalInvestments, foodLogsCount] = await Promise.all([
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.userId = :userId', { userId })
        .andWhere('expense.isDeleted = false')
        .getRawOne(),
      this.incomeRepository
        .createQueryBuilder('income')
        .select('SUM(income.amount)', 'total')
        .where('income.userId = :userId', { userId })
        .andWhere('income.isDeleted = false')
        .getRawOne(),
      this.investmentRepository
        .createQueryBuilder('investment')
        .select('SUM(investment.amount)', 'total')
        .where('investment.userId = :userId', { userId })
        .andWhere('investment.isDeleted = false')
        .getRawOne(),
      this.foodLogRepository.count({
        where: { userId, isDeleted: false },
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      metrics: {
        totalExpenses: parseFloat(totalExpenses?.total || '0'),
        totalIncome: parseFloat(totalIncome?.total || '0'),
        totalInvestments: parseFloat(totalInvestments?.total || '0'),
        foodLogsCount,
      },
    };
  }

  async updateUser(adminId: string, userId: string, updateDto: UpdateUserDto, ip?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, updateDto);

    // Log admin action
    await this.createAuditLog(adminId, 'USER_UPDATED', userId, ip, updateDto);

    return this.userRepository.findOne({ where: { id: userId } });
  }

  async deleteUser(adminId: string, userId: string, ip?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete admin user');
    }

    // Actually delete the user (hard delete)
    await this.userRepository.remove(user);
    await this.createAuditLog(adminId, 'USER_DELETED', userId, ip);
  }

  async resetUserPassword(adminId: string, userId: string, newPassword: string, ip?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash });
    await this.createAuditLog(adminId, 'PASSWORD_RESET', userId, ip);
  }

  // Platform Analytics
  async getPlatformAnalytics(startDate?: Date, endDate?: Date) {
    // Default to last 30 days for new signups if no date range is provided
    let newSignupsStartDate = startDate;
    let newSignupsEndDate = endDate;
    
    if (!startDate || !endDate) {
      newSignupsEndDate = new Date();
      newSignupsStartDate = new Date();
      newSignupsStartDate.setDate(newSignupsStartDate.getDate() - 30);
    }

    const [totalUsers, activeUsers, newSignups] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.userRepository.count({
        where: {
          createdAt: Between(newSignupsStartDate, newSignupsEndDate),
        },
      }),
    ]);

    const [totalExpenses, totalIncome, totalInvestments, totalFoodCost] = await Promise.all([
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.isDeleted = false')
        .getRawOne(),
      this.incomeRepository
        .createQueryBuilder('income')
        .select('SUM(income.amount)', 'total')
        .where('income.isDeleted = false')
        .getRawOne(),
      this.investmentRepository
        .createQueryBuilder('investment')
        .select('SUM(investment.amount)', 'total')
        .where('investment.isDeleted = false')
        .getRawOne(),
      this.foodLogRepository
        .createQueryBuilder('food')
        .select('COALESCE(SUM(food.cost), 0)', 'total')
        .where('food.isDeleted = false')
        .andWhere('food.cost IS NOT NULL')
        .getRawOne(),
    ]);

    // Daily active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dau = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastLogin >= :date', { date: thirtyDaysAgo })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getCount();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newSignups: newSignups || 0,
        dailyActiveUsers: dau,
      },
      finance: {
        totalExpenses: parseFloat(totalExpenses?.total || '0'),
        totalIncome: parseFloat(totalIncome?.total || '0'),
        totalInvestments: parseFloat(totalInvestments?.total || '0'),
        avgExpensePerUser: activeUsers > 0 ? parseFloat(totalExpenses?.total || '0') / activeUsers : 0,
      },
      food: {
        totalCost: parseFloat(totalFoodCost?.total || '0'),
        avgCostPerUser: activeUsers > 0 ? parseFloat(totalFoodCost?.total || '0') / activeUsers : 0,
      },
    };
  }

  // Categories Management
  async createCategory(createDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createDto);
    return this.categoryRepository.save(category);
  }

  async findAllCategories(type?: CategoryType): Promise<Category[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.categoryRepository.find({ where, order: { name: 'ASC' } });
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto): Promise<Category> {
    await this.categoryRepository.update(id, updateDto);
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find();
  }

  async getSystemSetting(key: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }

  async updateSystemSetting(
    adminId: string,
    key: string,
    updateDto: UpdateSystemSettingDto,
    ip?: string,
  ): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({ where: { key } });
    if (setting) {
      await this.systemSettingRepository.update(key, {
        ...updateDto,
        updatedBy: adminId,
      });
    } else {
      setting = this.systemSettingRepository.create({
        key,
        ...updateDto,
        updatedBy: adminId,
      });
      await this.systemSettingRepository.save(setting);
    }

    await this.createAuditLog(adminId, 'SETTINGS_UPDATED', key, ip, updateDto);
    return this.systemSettingRepository.findOne({ where: { key } });
  }

  // Audit Logs
  async getAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async createAuditLog(
    adminId: string,
    action: string,
    target: string,
    ip?: string,
    metadata?: any,
  ): Promise<AdminAuditLog> {
    const log = this.auditLogRepository.create({
      adminId,
      action,
      target,
      ip,
      metadata,
    });
    return this.auditLogRepository.save(log);
  }
}

