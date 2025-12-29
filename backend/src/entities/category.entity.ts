import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Expense } from './expense.entity';
import { FoodLog } from './food-log.entity';
import { Investment } from './investment.entity';

export enum CategoryType {
  EXPENSE = 'expense',
  FOOD = 'food',
  INVESTMENT = 'investment',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];

  @OneToMany(() => FoodLog, (foodLog) => foodLog.category)
  foodLogs: FoodLog[];

  @OneToMany(() => Investment, (investment) => investment.category)
  investments: Investment[];
}

