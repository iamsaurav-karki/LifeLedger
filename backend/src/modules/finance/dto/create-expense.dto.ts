import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsUUID, IsOptional, IsEnum, IsArray } from 'class-validator';
import { PaymentMethod } from '../../../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;
}

