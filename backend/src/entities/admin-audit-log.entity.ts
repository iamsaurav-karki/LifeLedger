import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('admin_audit_logs')
@Index(['admin', 'createdAt'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  adminId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column()
  action: string; // e.g., 'USER_DEACTIVATED', 'ROLE_CHANGED', 'SETTINGS_UPDATED'

  @Column({ nullable: true })
  target: string; // e.g., user ID, setting key

  @Column({ nullable: true })
  ip: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

