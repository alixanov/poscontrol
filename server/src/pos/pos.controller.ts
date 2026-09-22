import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import {
  OpenShiftDto,
  CloseShiftDto,
  CreateOrderDto,
  RefundOrderDto,
} from './dto/pos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from '../common/types';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('pos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('shift/active')
  @ApiOperation({ summary: 'Получить текущую открытую смену кассира' })
  getActiveShift(@CurrentUser('id') cashierId: string) {
    return this.posService.getActiveShift(cashierId);
  }

  @Post('shift/open')
  @ApiOperation({ summary: 'Открыть кассовую смену' })
  async openShift(
    @CurrentUser('id') cashierId: string,
    @Body() dto: OpenShiftDto,
  ) {
    const shift = await this.posService.openShift(cashierId, dto);
    await this.auditLogService.log({
      userId: cashierId,
      action: 'SHIFT_OPEN',
      entity: 'CashShift',
      entityId: shift.id,
      details: `Открыта смена №${shift.shiftNumber}, сумма: ${shift.startingCash}`,
    });
    return shift;
  }

  @Post('shift/close')
  @ApiOperation({ summary: 'Закрыть кассовую смену' })
  async closeShift(
    @CurrentUser('id') cashierId: string,
    @Body() dto: CloseShiftDto,
  ) {
    const shift = await this.posService.closeShift(cashierId, dto);
    await this.auditLogService.log({
      userId: cashierId,
      action: 'SHIFT_CLOSE',
      entity: 'CashShift',
      entityId: shift.id,
      details: `Закрыта смена №${shift.shiftNumber}. Ожидалось: ${shift.expectedCash}, факт: ${shift.actualCash}, разница: ${shift.cashDifference}`,
    });
    return shift;
  }

  @Post('orders')
  @ApiOperation({ summary: 'Оформить продажу и выбить чек' })
  async createOrder(
    @CurrentUser('id') cashierId: string,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.posService.createOrder(cashierId, dto);
    await this.auditLogService.log({
      userId: cashierId,
      action: 'SALE_ORDER',
      entity: 'Order',
      entityId: order.id,
      details: `Чек №${order.orderNumber} на сумму ${order.totalAmount} (${order.paymentMethod})`,
    });
    return order;
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: 'Оформить возврат по чеку' })
  async refundOrder(
    @Param('id') id: string,
    @Body() dto: RefundOrderDto,
    @CurrentUser('id') cashierId: string,
  ) {
    const order = await this.posService.refundOrder(id, dto);
    await this.auditLogService.log({
      userId: cashierId,
      action: 'REFUND_ORDER',
      entity: 'Order',
      entityId: order.id,
      details: `Возврат чека №${order.orderNumber}. Причина: ${dto.reason}`,
    });
    return order;
  }

  @Get('orders')
  @ApiOperation({ summary: 'Список всех заказов / чеков' })
  findAllOrders(
    @Query('cashierId') cashierId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.posService.findAllOrders({
      cashierId,
      shiftId,
      status,
      search,
      page,
      limit,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Получить детальную информацию по чеку' })
  findOrderById(@Param('id') id: string) {
    return this.posService.findOrderById(id);
  }
}
