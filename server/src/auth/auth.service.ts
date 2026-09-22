import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, PinLoginDto } from './dto/auth.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }
    const isMatch = await argon2.verify(user.passwordHash, pass);
    if (isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.generateTokens(user);
  }

  async pinLogin(dto: PinLoginDto) {
    const user = await this.usersService.findByPin(dto.pinCode);
    if (!user) {
      throw new UnauthorizedException('Неверный PIN-код');
    }
    const { passwordHash, ...safeUser } = user;
    return this.generateTokens(safeUser);
  }

  async generateTokens(user: { id: string; email: string; role: string; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'access-secret-key-super-secure-change-in-prod';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'refresh-secret-key-super-secure-change-in-prod';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
      throw new UnauthorizedException('Недействительный или истекший refresh токен');
    }

    // Delete old refresh token (token rotation)
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const user = tokenRecord.user;
    return this.generateTokens({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return { success: true, message: 'Успешный выход' };
  }
}
