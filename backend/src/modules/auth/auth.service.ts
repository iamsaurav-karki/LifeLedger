import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async validateAdmin(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token in Redis (with error handling)
    try {
      await this.redisService.set(
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60, // 7 days
      );
    } catch (error) {
      console.error('Failed to store refresh token in Redis:', error);
      // Continue without Redis - token will still work, just won't be stored
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'secret'),
      });

      const storedToken = await this.redisService.get(
        `refresh_token:${decoded.sub}`,
      );

      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findOne(decoded.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      const newAccessToken = this.jwtService.sign(payload);

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    try {
      await this.redisService.del(`refresh_token:${userId}`);
    } catch (error) {
      console.error('Failed to delete refresh token from Redis:', error);
      // Continue even if Redis fails
    }
    return { message: 'Logged out successfully' };
  }

  private generateRefreshToken(userId: string): string {
    const payload = { sub: userId, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'secret'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists. Please use a different email address.');
    }

    const passwordHash = await this.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      passwordHash,
      role: UserRole.USER, // Default role for registration
      status: UserStatus.ACTIVE, // Default status for registration
    });

    // Return success message instead of auto-login
    return {
      message: 'User registered successfully. Please login.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

