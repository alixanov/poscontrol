import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`Товар с артикулом ${dto.sku} уже существует`);
    }

    const existingBarcode = await this.prisma.product.findUnique({
      where: { barcode: dto.barcode },
    });
    if (existingBarcode) {
      throw new ConflictException(`Товар со штрихкодом ${dto.barcode} уже существует`);
    }

    // Find default warehouse to assign initial stock
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

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        categoryId: dto.categoryId || null,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        stockQuantity: dto.stockQuantity ?? 0,
        minStockAlert: dto.minStockAlert ?? 5,
        imageUrl: dto.imageUrl || null,
        unit: dto.unit || 'шт',
        isActive: dto.isActive ?? true,
        stocks: {
          create: {
            warehouseId: defaultWarehouse.id,
            quantity: dto.stockQuantity ?? 0,
          },
        },
      },
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });

    return product;
  }

  async findAll(query?: {
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 100;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query?.lowStock) {
      where.stockQuantity = { lte: 5 };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: limit,
        skip,
        include: {
          category: true,
          stocks: {
            include: { warehouse: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }

  async findByBarcode(barcode: string) {
    const cleanBarcode = barcode.trim();
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { barcode: cleanBarcode },
          { sku: cleanBarcode },
        ],
        isActive: true,
      },
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Товар со штрихкодом "${cleanBarcode}" не найден`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (existingSku) {
        throw new ConflictException(`Товар с артикулом ${dto.sku} уже существует`);
      }
    }

    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode, NOT: { id } },
      });
      if (existingBarcode) {
        throw new ConflictException(`Товар со штрихкодом ${dto.barcode} уже существует`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
