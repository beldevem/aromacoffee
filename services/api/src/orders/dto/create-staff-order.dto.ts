import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { OrderLineDto } from './create-order.dto';
import { PaymentMethod } from '../../generated/prisma/client';

export class CreateStaffOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsBoolean()
  takeaway?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  /** Allows the counter to take payment immediately when keying in the order. */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}

export class OrderQuantityDto {
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}
