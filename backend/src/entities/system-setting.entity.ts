import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn()
  key: string;

  @Column('text')
  value: string;

  @Column({ nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

