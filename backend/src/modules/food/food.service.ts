import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FoodLog } from '../../entities/food-log.entity';
import { Category, CategoryType } from '../../entities/category.entity';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { UpdateFoodLogDto } from './dto/update-food-log.dto';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodLog)
    private foodLogRepository: Repository<FoodLog>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(userId: string, createDto: CreateFoodLogDto): Promise<FoodLog> {
    const foodLog = this.foodLogRepository.create({
      ...createDto,
      userId,
    });
    return this.foodLogRepository.save(foodLog);
  }

  async findAll(userId: string, startDate?: Date, endDate?: Date): Promise<FoodLog[]> {
    const where: any = { userId, isDeleted: false };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.foodLogRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<FoodLog> {
    const foodLog = await this.foodLogRepository.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['category'],
    });
    if (!foodLog) {
      throw new NotFoundException('Food log not found');
    }
    return foodLog;
  }

  async update(id: string, userId: string, updateDto: UpdateFoodLogDto): Promise<FoodLog> {
    await this.findOne(id, userId);
    await this.foodLogRepository.update(id, updateDto);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.foodLogRepository.update(id, { isDeleted: true });
  }

  async getFoodAnalytics(userId: string, startDate: Date, endDate: Date) {
    const foodLogs = await this.foodLogRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
        isDeleted: false,
      },
    });

    // Calculate total cost only for logs with cost
    const totalCost = foodLogs.reduce((sum, log) => {
      const cost = log.cost != null ? parseFloat(log.cost.toString()) : 0;
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
    const totalCalories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const mealCount = foodLogs.length;
    // Calculate average cost only for meals that have a cost
    const mealsWithCost = foodLogs.filter(log => log.cost != null && log.cost !== undefined);
    const avgCostPerMeal = mealsWithCost.length > 0 ? totalCost / mealsWithCost.length : 0;
    const costPerCalorie = totalCalories > 0 ? totalCost / totalCalories : 0;

    // Group by meal type
    const mealTypeStats = foodLogs.reduce((acc, log) => {
      const type = log.mealType || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, totalCost: 0, totalCalories: 0 };
      }
      acc[type].count++;
      const cost = log.cost != null ? parseFloat(log.cost.toString()) : 0;
      acc[type].totalCost += isNaN(cost) ? 0 : cost;
      acc[type].totalCalories += log.calories || 0;
      return acc;
    }, {} as Record<string, { count: number; totalCost: number; totalCalories: number }>);

    return {
      totalCost,
      totalCalories,
      mealCount,
      avgCostPerMeal,
      costPerCalorie,
      mealTypeStats,
    };
  }

  async getFoodCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { type: CategoryType.FOOD, isActive: true },
    });
  }

  async createFoodCategory(name: string): Promise<Category> {
    if (!name || !name.trim()) {
      throw new BadRequestException('Category name is required');
    }

    const trimmedName = name.trim();
    
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { 
        type: CategoryType.FOOD, 
        name: trimmedName,
        isActive: true 
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      type: CategoryType.FOOD,
      name: trimmedName,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }
}

