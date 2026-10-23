import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../common/types';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Database-level aggregation for total historical metrics
    const totalAgg = await this.prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    const totalRevenue = totalAgg._sum.totalAmount || 0;
    const totalOrdersCount = totalAgg._count.id || 0;

    // 2. Database-level aggregation for today's metrics
    const todayAgg = await this.prisma.order.aggregate({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: today },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    });
    const todayRevenue = todayAgg._sum.totalAmount || 0;
    const todayOrdersCount = todayAgg._count.id || 0;
    const averageReceipt = Math.round(todayAgg._avg.totalAmount || 0);

    // 3. Selective item fetch only for today's cost calculation
    const todayItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: OrderStatus.COMPLETED,
          createdAt: { gte: today },
        },
      },
      select: { costPrice: true, quantity: true },
    });
    const todayCost = todayItems.reduce(
      (acc, item) => acc + (item.costPrice || 0) * item.quantity,
      0,
    );
    const todayProfit = todayRevenue - todayCost;

    // 4. Lean cost calculation for lifetime margin
    const allItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: OrderStatus.COMPLETED,
        },
      },
      select: { costPrice: true, quantity: true },
    });
    const totalCost = allItems.reduce(
      (acc, item) => acc + (item.costPrice || 0) * item.quantity,
      0,
    );
    const totalProfit = totalRevenue - totalCost;

    // 5. Stock and customer counts
    const [lowStockProducts, totalProductsCount, totalCustomersCount] = await Promise.all([
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 },
        },
      }),
      this.prisma.product.count({
        where: { isActive: true },
      }),
      this.prisma.customer.count({
        where: { isActive: true },
      }),
    ]);

    return {
      todayRevenue,
      todayProfit,
      todayOrdersCount,
      averageReceipt,
      totalRevenue,
      totalProfit,
      totalOrdersCount,
      lowStockProducts,
      totalProductsCount,
      totalCustomersCount,
    };
  }

  async getSalesChart(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            costPrice: true,
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { date: string; revenue: number; profit: number; count: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      grouped[key] = { date: key, revenue: 0, profit: 0, count: 0 };
    }

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().slice(5, 10);
      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, profit: 0, count: 0 };
      }
      const orderCost = order.items.reduce(
        (acc, item) => acc + (item.costPrice || 0) * item.quantity,
        0,
      );
      grouped[key].revenue += order.totalAmount;
      grouped[key].profit += order.totalAmount - orderCost;
      grouped[key].count += 1;
    }

    return Object.values(grouped);
  }

  async getTopSellingProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        total: true,
      },
      where: {
        order: {
          status: OrderStatus.COMPLETED,
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      soldQuantity: item._sum.quantity || 0,
      totalRevenue: item._sum.total || 0,
    }));
  }

  async getPaymentMethodStats() {
    const orders = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { status: OrderStatus.COMPLETED },
    });

    return orders.map((o) => ({
      method: o.paymentMethod,
      count: o._count.id,
      amount: o._sum.totalAmount || 0,
    }));
  }
}
