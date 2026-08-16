import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, Max, ValidateNested } from 'class-validator';

export class OrderLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
