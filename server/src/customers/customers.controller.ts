import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать / зарегистрировать клиента' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список клиентов с пагинацией' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.findAll(search, Number(page) || 1, Number(limit) || 50);
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Быстрый поиск клиента по телефону или имени (для POS)' })
  search(@Query('q') q: string) {
    return this.customersService.search(q);
  }

  @Get('by-phone/:phone')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Поиск клиента по точному номеру телефона' })
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Карточка клиента по ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить данные клиента' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Деактивировать клиента (Администратор)' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
