import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового сотрудника' })
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') adminId: string) {
    const user = await this.usersService.create(dto);
    await this.auditLogService.log({
      userId: adminId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: `Создан сотрудник: ${user.name} (${user.email}, роль: ${user.role})`,
    });
    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Список всех сотрудников' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить данные сотрудника по ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать сотрудника' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    const user = await this.usersService.update(id, dto);
    await this.auditLogService.log({
      userId: adminId,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      details: `Обновлен сотрудник: ${user.name}`,
    });
    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать сотрудника' })
  async remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    const user = await this.usersService.remove(id);
    await this.auditLogService.log({
      userId: adminId,
      action: 'DELETE',
      entity: 'User',
      entityId: user.id,
      details: `Деактивирован сотрудник ID ${id}`,
    });
    return { success: true, message: 'Сотрудник деактивирован' };
  }
}
