import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Expense } from './expense.entity';
import { Income } from './income.entity';
import { Investment } from './investment.entity';
import { FoodLog } from './food-log.entity';
import { AdminAuditLog } from './admin-audit-log.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => Income, (income) => income.user)
  incomes: Income[];

  @OneToMany(() => Investment, (investment) => investment.user)
  investments: Investment[];

  @OneToMany(() => FoodLog, (foodLog) => foodLog.user)
  foodLogs: FoodLog[];

  @OneToMany(() => AdminAuditLog, (log) => log.admin)
  auditLogs: AdminAuditLog[];
}

