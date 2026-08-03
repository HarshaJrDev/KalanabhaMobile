import { Injectable } from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import ms from 'ms';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessTtl'),
      },
    );
  }

  signRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshTtl'),
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }

  getRefreshTokenExpiry(): Date {
    const ttl = this.configService.get<string>('jwt.refreshTtl') ?? '30d';
    return new Date(Date.now() + ms(ttl));
  }

  // Refresh tokens are already high-entropy random-looking JWTs, not
  // low-entropy human passwords — bcrypt is the wrong tool here: it
  // silently truncates input at 72 bytes, and every refresh token for the
  // same user shares an identical >72-byte prefix (header + sub/email/role),
  // which made bcrypt.compare() match ANY of a user's tokens against ANY
  // other, defeating single-use rotation entirely. SHA-256 hashes the full
  // string deterministically; compared with a timing-safe check since this
  // guards an auth boundary.
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  tokensMatch(token: string, storedHash: string): boolean {
    const candidate = Buffer.from(this.hashToken(token), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    if (candidate.length !== stored.length) {
      return false;
    }
    return timingSafeEqual(candidate, stored);
  }
}
