import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Wait a bit for database to be ready, then retry with exponential backoff
    await this.initializeAdminUserWithRetry();
  }

  private async initializeAdminUserWithRetry(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.initializeAdminUser();
        return; // Success, exit
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        
        // If table doesn't exist yet, wait and retry
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
          if (i < retries - 1) {
            this.logger.warn(
              `Database tables not ready yet. Retrying in ${delay}ms... (${i + 1}/${retries})`,
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // Exponential backoff
            continue;
          } else {
            this.logger.warn(
              `Database tables not ready after ${retries} retries. Admin user will need to be created manually or backend restarted after database setup.`,
            );
            return;
          }
        }
        
        // For other errors, log and exit
        this.logger.error(
          `Failed to initialize admin user: ${errorMessage}`,
          error.stack,
        );
        return;
      }
    }
  }

  private async initializeAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminName = this.configService.get<string>('ADMIN_NAME', 'Admin User');

    // Skip if admin credentials are not provided
    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Skipping admin user initialization.',
      );
      return;
    }

    try {
      // Check if admin user already exists
      const existingAdmin = await this.usersRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        // Update password if user exists but password might have changed
        if (existingAdmin.role === UserRole.ADMIN) {
          const passwordHash = await bcrypt.hash(adminPassword, 10);
          await this.usersRepository.update(existingAdmin.id, {
            passwordHash,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          });
          this.logger.log(
            `✅ Admin user updated: ${adminEmail}`,
          );
        } else {
          // If user exists but is not admin, update to admin
          const passwordHash = await bcrypt.hash(adminPassword, 10);
          await this.usersRepository.update(existingAdmin.id, {
            role: UserRole.ADMIN,
            passwordHash,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          });
          this.logger.log(
            `✅ User promoted to admin: ${adminEmail}`,
          );
        }
        return;
      }

      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminUser = this.usersRepository.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      await this.usersRepository.save(adminUser);
      this.logger.log(
        `✅ Admin user created successfully: ${adminEmail}`,
      );
    } catch (error: any) {
      // Re-throw to be handled by retry logic
      throw error;
    }
  }
}

