import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OpenShiftDto,
  CloseShiftDto,
  CreateOrderDto,
  RefundOrderDto,
} from './dto/pos.dto';
import { ShiftStatus, OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    return `CHK-${timestamp}-${rand}`;
  }

  // --- Shifts ---
  async getActiveShift(cashierId: string) {
    return this.prisma.cashShift.findFirst({
      where: {
        cashierId,
        status: ShiftStatus.OPEN,
      },
      include: {
        cashier: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async openShift(cashierId: string, dto: OpenShiftDto) {
    const existing = await this.getActiveShift(cashierId);
    if (existing) {
      throw new BadRequestException('У вас уже есть открытая кассовая смена');
    }

    return this.prisma.cashShift.create({
      data: {
        cashierId,
        startingCash: dto.startingCash,
        expectedCash: dto.startingCash,
        status: ShiftStatus.OPEN,
        notes: dto.notes,
      },
      include: {
        cashier: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async closeShift(cashierId: string, dto: CloseShiftDto) {
    const shift = await this.getActiveShift(cashierId);
    if (!shift) {
      throw new BadRequestException('Нет открытой смены для закрытия');
    }

    const difference = dto.actualCash - shift.expectedCash;

    return this.prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        actualCash: dto.actualCash,
        cashDifference: difference,
        status: ShiftStatus.CLOSED,
        closedAt: new Date(),
        notes: dto.notes ? `${shift.notes || ''} | ${dto.notes}`.trim() : shift.notes,
      },
      include: {
        cashier: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // --- Orders / Checkout ---
  async createOrder(cashierId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

    const activeShift = await this.getActiveShift(cashierId);

    // Resolve default warehouse for sales deduction
    let defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { isDefault: true },
    });
    if (!defaultWarehouse) {
      defaultWarehouse = await this.prisma.warehouse.findFirst();
    }

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Товар с ID ${item.productId} не найден`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stockQuantity}, запрошено: ${item.quantity}`,
          );
        }

        const lineTotal = item.quantity * item.price;
        subtotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: item.quantity,
          price: item.price,
          costPrice: product.costPrice,
          total: lineTotal,
        });

        // Deduct from stockQuantity
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        // Deduct from warehouse stock if warehouse exists
        if (defaultWarehouse) {
          await tx.stock.upsert({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: defaultWarehouse.id,
              },
            },
            update: { quantity: { decrement: item.quantity } },
            create: {
              productId: product.id,
              warehouseId: defaultWarehouse.id,
              quantity: -item.quantity,
            },
          });
        }
      }

      const discount = dto.discountAmount || 0;
      const totalAmount = Math.max(0, subtotal - discount);

      let changeGiven = 0;
      if (dto.paymentMethod === PaymentMethod.CASH && dto.cashReceived) {
        if (dto.cashReceived < totalAmount) {
          throw new BadRequestException('Полученная сумма меньше суммы чека');
        }
        changeGiven = dto.cashReceived - totalAmount;
      }

      const orderNumber = this.generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          shiftId: activeShift ? activeShift.id : null,
          cashierId,
          subtotal,
          discountAmount: discount,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          cashReceived: dto.cashReceived || totalAmount,
          changeGiven,
          status: OrderStatus.COMPLETED,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          cashier: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update shift expected cash if CASH payment
      if (activeShift && dto.paymentMethod === PaymentMethod.CASH) {
        await tx.cashShift.update({
          where: { id: activeShift.id },
          data: { expectedCash: { increment: totalAmount } },
        });
      }

      return order;
    });
  }

  async refundOrder(orderId: string, dto: RefundOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Чек не найден');
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('По данному чеку уже был произведен возврат');
    }

    let defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { isDefault: true },
    });
    if (!defaultWarehouse) {
      defaultWarehouse = await this.prisma.warehouse.findFirst();
    }

    return this.prisma.$transaction(async (tx) => {
      // Return items to stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        if (defaultWarehouse) {
          await tx.stock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: defaultWarehouse.id,
              },
            },
            update: { quantity: { increment: item.quantity } },
            create: {
              productId: item.productId,
              warehouseId: defaultWarehouse.id,
              quantity: item.quantity,
            },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUNDED,
          refundReason: dto.reason,
        },
        include: {
          items: true,
          cashier: {
            select: { id: true, name: true },
          },
        },
      });

      // If attached to active shift and cash payment, adjust expected cash
      if (order.shiftId && order.paymentMethod === PaymentMethod.CASH) {
        const shift = await tx.cashShift.findUnique({
          where: { id: order.shiftId },
        });
        if (shift && shift.status === ShiftStatus.OPEN) {
          await tx.cashShift.update({
            where: { id: shift.id },
            data: { expectedCash: { decrement: order.totalAmount } },
          });
        }
      }

      return updatedOrder;
    });
  }

  async findAllOrders(query?: {
    cashierId?: string;
    shiftId?: string;
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.cashierId) where.cashierId = query.cashierId;
    if (query?.shiftId) where.shiftId = query.shiftId;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.orderNumber = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          cashier: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit };
  }

  async findOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        cashier: {
          select: { id: true, name: true, email: true },
        },
        shift: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Чек не найден');
    }

    return order;
  }
}
