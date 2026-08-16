import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  seats?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
