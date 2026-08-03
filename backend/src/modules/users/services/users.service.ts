import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../repositories/users.repository';
import { CreateDriverDto } from '../dto/create-driver.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  updateFcmToken(userId: string, fcmToken: string) {
    return this.usersRepository.updateFcmToken(userId, fcmToken);
  }

  setOnlineStatus(userId: string, isOnline: boolean) {
    return this.usersRepository.setOnlineStatus(userId, isOnline);
  }

  findDrivers() {
    return this.usersRepository.findDrivers();
  }

  findOnlineDrivers() {
    return this.usersRepository.findOnlineDrivers();
  }

  async createDriver(dto: CreateDriverDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.usersRepository.createDriver({
      email: dto.email,
      passwordHash,
      displayName: dto.name,
      phone: dto.phone,
      vehicleType: dto.vehicle,
      licenseNumber: dto.license,
      rating: dto.rating ?? 5,
    });
  }

  setDocumentsVerified(driverId: string, verified: boolean) {
    return this.usersRepository.setDocumentsVerified(driverId, verified);
  }
}
