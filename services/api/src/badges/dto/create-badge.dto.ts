import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  labelFr!: string;

  @IsString()
  @IsNotEmpty()
  labelAr!: string;
}
