import { IsNotEmpty, IsString, Length } from 'class-validator';

export class StartOrderSessionDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  qrToken!: string;
}
