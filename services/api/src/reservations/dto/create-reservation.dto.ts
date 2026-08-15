import { IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';
import { ReservationStatus } from '../../generated/prisma/client';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+216[24579]\d{7}$/)
  contactPhone!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsDateString()
  dateTime!: string;

  @IsInt()
  @Min(1)
  partySize!: number;

  @IsString()
  @IsIn(['INDOOR', 'OUTDOOR_TERRACE', 'N/A'])
  location!: 'INDOOR' | 'OUTDOOR_TERRACE' | 'N/A';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  source?: string;
}
