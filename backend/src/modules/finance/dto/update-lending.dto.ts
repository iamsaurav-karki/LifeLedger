import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { LendingType, LendingStatus } from '../../../entities/lending.entity';

export class UpdateLendingDto {
  @ApiProperty({ required: false, enum: LendingType })
  @IsOptional()
  @IsEnum(LendingType)
  type?: LendingType;

  @ApiProperty({ required: false, example: 1000.00 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workDescription?: string;

  @ApiProperty({ required: false, example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, enum: LendingStatus })
  @IsOptional()
  @IsEnum(LendingStatus)
  status?: LendingStatus;

  @ApiProperty({ required: false, example: 500.00 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}

