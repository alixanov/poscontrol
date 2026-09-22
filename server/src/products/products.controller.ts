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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Добавить товар (Администратор)' })
  async create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) {
    const product = await this.productsService.create(dto);
    await this.auditLogService.log({
      userId,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      details: `Добавлен товар: ${product.name} (Арт: ${product.sku}, Штрихкод: ${product.barcode}, Цена: ${product.salePrice})`,
    });
    return product;
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Список товаров с фильтрацией и поиском' })
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStock') lowStock?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll({
      search,
      categoryId,
      lowStock: lowStock === 'true',
      page,
      limit,
    });
  }

  @Get('barcode/:barcode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Поиск товара по штрихкоду для кассы' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить товар по ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Редактировать товар (Администратор)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    const product = await this.productsService.update(id, dto);
    await this.auditLogService.log({
      userId,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      details: `Обновлен товар: ${product.name} (Цена: ${product.salePrice})`,
    });
    return product;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Удалить / скрыть товар (Администратор)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const res = await this.productsService.remove(id);
    await this.auditLogService.log({
      userId,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: id,
      details: `Удален товар ID ${id}`,
    });
    return res;
  }
}
