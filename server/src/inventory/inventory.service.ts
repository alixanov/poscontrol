import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStockMovementDto,
  CreateWarehouseDto,
} from './dto/inventory.dto';
import { MovementType } from '../common/types';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private generateMovementNumber(type: MovementType): string {
    const prefix =
      type === MovementType.RECEIPT
        ? 'REC'
        : type === MovementType.WRITE_OFF
        ? 'WOF'
        : 'TRF';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${rand}`;
  }

  async createMovement(userId: string, dto: CreateStockMovementDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Необходимо указать хотя бы один товар');
    }

    // Resolve default warehouse if missing
    let defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { isDefault: true },
    });
    if (!defaultWarehouse) {
      defaultWarehouse = await this.prisma.warehouse.findFirst();
      if (!defaultWarehouse) {
        defaultWarehouse = await this.prisma.warehouse.create({
          data: { name: 'Основной склад', isDefault: true },
        });
      }
    }

    const sourceWhId = dto.sourceWarehouseId || defaultWarehouse.id;
    const targetWhId = dto.targetWarehouseId || defaultWarehouse.id;

    if (dto.type === MovementType.TRANSFER && sourceWhId === targetWhId) {
      throw new BadRequestException('Склад-источник и склад-назначение должны различаться при перемещении');
    }

    const movementNumber = this.generateMovementNumber(dto.type);

    return this.prisma.$transaction(async (tx) => {
      // 1. Process each item and adjust stock
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Товар с ID ${item.productId} не найден`);
        }

        if (dto.type === MovementType.RECEIPT) {
          // Increase stock in target warehouse
          const currentStock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: targetWhId,
              },
            },
          });

          if (currentStock) {
            await tx.stock.update({
              where: { id: currentStock.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.stock.create({
              data: {
                productId: product.id,
                warehouseId: targetWhId,
                quantity: item.quantity,
              },
            });
          }

          // Update total product stock and optionally cost price
          const productUpdateData: any = {
            stockQuantity: { increment: item.quantity },
          };
          if (item.costPrice && item.costPrice > 0) {
            productUpdateData.costPrice = item.costPrice;
          }

          await tx.product.update({
            where: { id: product.id },
            data: productUpdateData,
          });
        } else if (dto.type === MovementType.WRITE_OFF) {
          // Decrease stock in source warehouse
          const currentStock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: sourceWhId,
              },
            },
          });

          if (!currentStock || currentStock.quantity < item.quantity) {
            throw new BadRequestException(
              `Недостаточно товара "${product.name}" на складе списания. Доступно: ${currentStock?.quantity || 0}, запрошено: ${item.quantity}`,
            );
          }

          await tx.stock.update({
            where: { id: currentStock.id },
            data: { quantity: { decrement: item.quantity } },
          });

          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else if (dto.type === MovementType.TRANSFER) {
          // Deduct from source warehouse
          const sourceStock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: sourceWhId,
              },
            },
          });

          if (!sourceStock || sourceStock.quantity < item.quantity) {
            throw new BadRequestException(
              `Недостаточно товара "${product.name}" на исходном складе для перемещения. Доступно: ${sourceStock?.quantity || 0}`,
            );
          }

          await tx.stock.update({
            where: { id: sourceStock.id },
            data: { quantity: { decrement: item.quantity } },
          });

          // Add to target warehouse
          const targetStock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: targetWhId,
              },
            },
          });

          if (targetStock) {
            await tx.stock.update({
              where: { id: targetStock.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.stock.create({
              data: {
                productId: product.id,
                warehouseId: targetWhId,
                quantity: item.quantity,
              },
            });
          }
        }
      }

      // 2. Create StockMovement record with items
      const movement = await tx.stockMovement.create({
        data: {
          movementNumber,
          type: dto.type,
          sourceWarehouseId:
            dto.type === MovementType.RECEIPT ? null : sourceWhId,
          targetWarehouseId:
            dto.type === MovementType.WRITE_OFF ? null : targetWhId,
          userId,
          reason: dto.reason || null,
          notes: dto.notes || null,
          items: {
            create: dto.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              costPrice: i.costPrice || 0,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          sourceWarehouse: true,
          targetWarehouse: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return movement;
    });
  }

  async findAllMovements(query?: {
    type?: MovementType;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.type) {
      where.type = query.type;
    }

    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true, unit: true },
              },
            },
          },
          sourceWarehouse: true,
          targetWarehouse: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async getWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        _count: {
          select: { stocks: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: dto,
    });
  }

  async getStocks(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    return this.prisma.stock.findMany({
      where,
      include: {
        warehouse: true,
        product: {
          include: { category: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });
  }
}
