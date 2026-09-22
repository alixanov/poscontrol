import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.warn('⚠️ [PrismaService] Database connection not established immediately (waiting for DB service or migrations).', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
