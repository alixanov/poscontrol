import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
      },
      include: {
        items: true,
      },
    });

    const todayOrders = completedOrders.filter(
      (o) => new Date(o.createdAt) >= today,
    );

    // Revenue & Profit calculations
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    let totalCost = 0;
    let todayCost = 0;

    for (const order of completedOrders) {
      for (const item of order.items) {
        totalCost += (item.costPrice || 0) * item.quantity;
      }
    }

    for (const order of todayOrders) {
      for (const item of order.items) {
        todayCost += (item.costPrice || 0) * item.quantity;
      }
    }

    const totalProfit = totalRevenue - totalCost;
    const todayProfit = todayRevenue - todayCost;
    const averageReceipt =
      todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

    // Count low stock items (stock <= minStockAlert)
    const lowStockProducts = await this.prisma.product.count({
      where: {
        isActive: true,
        stockQuantity: { lte: 5 },
      },
    });

    const totalProductsCount = await this.prisma.product.count({
      where: { isActive: true },
    });

    return {
      todayRevenue,
      todayProfit,
      todayOrdersCount: todayOrders.length,
      averageReceipt,
      totalRevenue,
      totalProfit,
      totalOrdersCount: completedOrders.length,
      lowStockProducts,
      totalProductsCount,
    };
  }

  async getSalesChart(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: startDate },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { date: string; revenue: number; profit: number; count: number }> = {};

    for (let i = 0; i <= days; i++) {
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
