import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { InvestmentType } from '../../../entities/investment.entity';

export class CreateInvestmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: InvestmentType })
  @IsEnum(InvestmentType)
  type: InvestmentType;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false, example: 1100.00 })
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;
}

