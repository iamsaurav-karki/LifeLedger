import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { LendingType, LendingStatus } from '../../../entities/lending.entity';

export class CreateLendingDto {
  @ApiProperty({ enum: LendingType })
  @IsEnum(LendingType)
  type: LendingType;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  personName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workDescription?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, enum: LendingStatus, default: 'pending' })
  @IsOptional()
  @IsEnum(LendingStatus)
  status?: LendingStatus;
}

