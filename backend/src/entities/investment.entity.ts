import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

export enum InvestmentType {
  STOCK = 'stock',
  BOND = 'bond',
  MUTUAL_FUND = 'mutual_fund',
  SIP = 'sip', // Systematic Investment Plan
  CID = 'cid', // Cumulative Investment Deposit
  SSF = 'ssf', // Social Security Fund
  CRYPTO = 'crypto',
  REAL_ESTATE = 'real_estate',
  FIXED_DEPOSIT = 'fixed_deposit',
  OTHER = 'other',
}

@Entity('investments')
@Index(['user', 'date'])
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({
    type: 'enum',
    enum: InvestmentType,
  })
  type: InvestmentType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentValue: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

