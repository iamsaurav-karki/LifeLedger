import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../../entities/user.entity';
import { Expense } from '../../entities/expense.entity';
import { Income } from '../../entities/income.entity';
import { Investment } from '../../entities/investment.entity';
import { FoodLog } from '../../entities/food-log.entity';
import { AdminAuditLog } from '../../entities/admin-audit-log.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Category } from '../../entities/category.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Expense,
      Income,
      Investment,
      FoodLog,
      AdminAuditLog,
      SystemSetting,
      Category,
    ]),
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

