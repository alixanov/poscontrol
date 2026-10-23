import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Алишер Навои' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 'Постоянный клиент' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Алишер Навои' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  cashbackBalance?: number;

  @ApiPropertyOptional({ example: 'Заметка' })
  @IsString()
  @IsOptional()
  notes?: string;
}
