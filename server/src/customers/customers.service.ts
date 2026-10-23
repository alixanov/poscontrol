import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { totalPurchases: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async search(query: string) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    return this.prisma.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { phone: { contains: q } },
          { name: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { totalPurchases: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Клиент не найден');
    return customer;
  }

  async findByPhone(phone: string) {
    const cleanPhone = phone.trim();
    return this.prisma.customer.findFirst({
      where: {
        phone: cleanPhone,
        isActive: true,
      },
    });
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone.trim() },
    });
    if (existing) {
      throw new ConflictException('Клиент с таким номером телефона уже зарегистрирован');
    }

    return this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        discountPercent: Number(dto.discountPercent) || 0,
        notes: dto.notes?.trim(),
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    if (dto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          phone: dto.phone.trim(),
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Номер телефона уже используется другим клиентом');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.phone && { phone: dto.phone.trim() }),
        ...(dto.discountPercent !== undefined && { discountPercent: Number(dto.discountPercent) }),
        ...(dto.cashbackBalance !== undefined && { cashbackBalance: Number(dto.cashbackBalance) }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
