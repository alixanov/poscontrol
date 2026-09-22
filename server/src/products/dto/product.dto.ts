import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Кофе зерновой Arabica 1кг' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'COF-ARA-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: '4607001234567' })
  @IsString()
  @IsNotEmpty()
  barcode: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 650.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @ApiProperty({ example: 1200.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @ApiPropertyOptional({ example: 25, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStockAlert?: number;

  @ApiPropertyOptional({ example: '/uploads/coffee.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'шт', default: 'шт' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Кофе зерновой Arabica 1кг' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'COF-ARA-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '4607001234567' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 650.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 1200.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStockAlert?: number;

  @ApiPropertyOptional({ example: '/uploads/coffee.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'шт' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
