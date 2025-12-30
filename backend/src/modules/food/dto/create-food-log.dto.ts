import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateFoodLogDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: 25.50 })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  foodName?: string;

  @ApiProperty({ required: false, example: 'lunch' })
  @IsOptional()
  @IsString()
  mealType?: string;

  @ApiProperty({ required: false, example: 500 })
  @IsOptional()
  @IsNumber()
  calories?: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

