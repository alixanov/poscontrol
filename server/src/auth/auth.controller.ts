import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, PinLoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Response, Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход по email и паролю' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);

    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await this.auditLogService.log({
      userId: data.user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: data.user.id,
      details: `Вход в систему: ${data.user.email} (${data.user.role})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return data;
  }

  @Post('pin-login')
  @ApiOperation({ summary: 'Быстрый вход кассира по PIN-коду' })
  async pinLogin(
    @Body() dto: PinLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.pinLogin(dto);

    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await this.auditLogService.log({
      userId: data.user.id,
      action: 'PIN_LOGIN',
      entity: 'User',
      entityId: data.user.id,
      details: `Быстрый вход кассира по PIN: ${data.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return data;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновление пары токенов' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.refreshTokens(dto.refreshToken);
    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return data;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Выход из системы' })
  async logout(
    @Body() dto: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('accessToken');
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Текущий авторизованный профиль' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
