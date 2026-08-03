import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../types/auth.types';

const ROLES: UserRole[] = ['customer', 'driver', 'admin', 'dispatcher', 'warehouse'];

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsEnum(ROLES)
  role!: UserRole;
}
