import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, required: false })
  @IsEnum(UserRole)
  @IsString()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, default: UserStatus.ACTIVE, required: false })
  @IsEnum(UserStatus)
  @IsString()
  status?: UserStatus;
}

