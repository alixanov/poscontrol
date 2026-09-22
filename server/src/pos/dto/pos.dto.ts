import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class OpenShiftDto {
  @ApiProperty({ example: 5000.0, description: 'Разменная сумма в кассе при открытии' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  startingCash: number;

  @ApiPropertyOptional({ example: 'Утренняя смена' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 25400.0, description: 'Фактическая сумма наличных в кассе при пересчете' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualCash: number;

  @ApiPropertyOptional({ example: 'Смена закрыта без расхождений' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 350.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 1000.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  cashReceived?: number;
}

export class RefundOrderDto {
  @ApiProperty({ example: 'Возврат товара покупателем: брак упаковки' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
