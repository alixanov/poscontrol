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
import { MovementType } from '../../common/types';

export class MovementItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPrice?: number;
}

export class CreateStockMovementDto {
  @ApiProperty({ enum: MovementType, example: MovementType.RECEIPT })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiPropertyOptional({ example: 'uuid-of-source-warehouse' })
  @IsString()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-target-warehouse' })
  @IsString()
  @IsOptional()
  targetWarehouseId?: string;

  @ApiPropertyOptional({ example: 'Поставка от ООО Продукт' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [MovementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementItemDto)
  items: MovementItemDto[];
}

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Торговый зал' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'ул. Ленина 10' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isDefault?: boolean;
}
