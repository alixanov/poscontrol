import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Сводка ключевых показателей дашборда (выручка, прибыль, средний чек)' })
  getSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('chart')
  @ApiOperation({ summary: 'График динамики продаж и прибыли' })
  getChart(@Query('days') days?: number) {
    return this.reportsService.getSalesChart(Number(days) || 7);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Топ популярных и продаваемых товаров' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.reportsService.getTopSellingProducts(Number(limit) || 10);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Статистика по методам оплаты (наличные / карта)' })
  getPaymentStats() {
    return this.reportsService.getPaymentMethodStats();
  }
}
