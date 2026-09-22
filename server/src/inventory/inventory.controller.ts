import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateStockMovementDto,
  CreateWarehouseDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, MovementType } from '../common/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('movements')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать складскую операцию (Приход, Списание, Перемещение)' })
  async createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    const movement = await this.inventoryService.createMovement(userId, dto);
    await this.auditLogService.log({
      userId,
      action: `STOCK_${dto.type}`,
      entity: 'StockMovement',
      entityId: movement.id,
      details: `Операция ${dto.type} №${movement.movementNumber}. Позиций: ${movement.items.length}`,
    });
    return movement;
  }

  @Get('movements')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'История складских операций' })
  findAllMovements(
    @Query('type') type?: MovementType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllMovements({ type, page, limit });
  }

  @Get('stocks')
  @ApiOperation({ summary: 'Текущие складские остатки' })
  getStocks(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getStocks(warehouseId);
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'Список складов и торговых точек' })
  getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Post('warehouses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать склад (Администратор)' })
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }
}
