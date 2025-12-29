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

export enum LendingType {
  LEND = 'lend', // Money you lent to someone (they owe you)
  BORROW = 'borrow', // Money you borrowed from someone (you owe them)
}

export enum LendingStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('lendings')
@Index(['user', 'date'])
export class Lending {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: LendingType,
  })
  type: LendingType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column()
  personName: string; // Name of the person you lent to or borrowed from

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  workDescription: string; // Description of the work/service

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: LendingStatus,
    default: LendingStatus.PENDING,
  })
  status: LendingStatus;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

