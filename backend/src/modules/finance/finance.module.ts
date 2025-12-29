import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Expense } from '../../entities/expense.entity';
import { Income } from '../../entities/income.entity';
import { Investment } from '../../entities/investment.entity';
import { Category } from '../../entities/category.entity';
import { Lending } from '../../entities/lending.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Income, Investment, Category, Lending])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

