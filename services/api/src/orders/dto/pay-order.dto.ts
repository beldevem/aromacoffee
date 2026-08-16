import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/client';

export class PayOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
