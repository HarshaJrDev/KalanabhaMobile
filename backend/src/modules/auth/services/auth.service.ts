import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from './token.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);

    const stored = await this.authRepository.findLatestActiveRefreshToken(payload.sub);

    if (!stored || !this.tokenService.tokensMatch(dto.refreshToken, stored.tokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.authRepository.revokeRefreshToken(stored.id);

    return this.issueTokens(payload.sub, payload.email, payload.role);
  }

  async logout(userId: string) {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = this.tokenService.signAccessToken({ sub: userId, email, role });
    const refreshToken = this.tokenService.signRefreshToken({ sub: userId, email, role });

    const tokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.authRepository.createRefreshToken({ userId, tokenHash, expiresAt });

    return { accessToken, refreshToken };
  }
}
