import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class VehicleConfigDto {
  @IsString()
  name!: string;

  @IsString()
  icon!: string;

  @IsNumber()
  maxWeight!: number;

  @IsNumber()
  maxLength!: number;

  @IsNumber()
  maxWidth!: number;

  @IsNumber()
  maxHeight!: number;

  @IsNumber()
  maxVolume!: number;

  @IsNumber()
  baseRate!: number;

  @IsNumber()
  ratePerKm!: number;

  @IsArray()
  @IsString({ each: true })
  specialConditions!: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsString()
  color!: string;
}
