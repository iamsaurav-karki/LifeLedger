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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { UpdateFoodLogDto } from './dto/update-food-log.dto';

@ApiTags('Food')
@Controller('food')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post('logs')
  @ApiOperation({ summary: 'Create food log' })
  create(@CurrentUser() user: User, @Body() createDto: CreateFoodLogDto) {
    return this.foodService.create(user.id, createDto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get all food logs' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.foodService.findAll(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get food log by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.foodService.findOne(id, user.id);
  }

  @Patch('logs/:id')
  @ApiOperation({ summary: 'Update food log' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFoodLogDto,
  ) {
    return this.foodService.update(id, user.id, updateDto);
  }

  @Delete('logs/:id')
  @ApiOperation({ summary: 'Delete food log' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.foodService.remove(id, user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get food analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getAnalytics(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.foodService.getFoodAnalytics(user.id, new Date(startDate), new Date(endDate));
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get food categories' })
  getCategories() {
    return this.foodService.getFoodCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create food category' })
  createCategory(@Body() createDto: { name: string }) {
    return this.foodService.createFoodCategory(createDto.name);
  }
}

