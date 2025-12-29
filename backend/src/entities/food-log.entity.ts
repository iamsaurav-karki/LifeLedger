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

@Entity('food_logs')
@Index(['user', 'date'])
export class FoodLog {
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

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ nullable: true })
  foodName: string;

  @Column({ nullable: true })
  mealType: string; // breakfast, lunch, dinner, snack

  @Column('int', { nullable: true })
  calories: number;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

