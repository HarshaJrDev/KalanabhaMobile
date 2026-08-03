import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class GeoPointDto {
  @IsString()
  address!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

class ContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

class PackageDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CreateShipmentDto {
  @IsString()
  goodsType!: string;

  @IsNumber()
  weightKg!: number;

  @ValidateNested()
  @Type(() => GeoPointDto)
  pickup!: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  drop!: GeoPointDto;

  @ValidateNested()
  @Type(() => ContactDto)
  sender!: ContactDto;

  @ValidateNested()
  @Type(() => ContactDto)
  receiver!: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PackageDto)
  package?: PackageDto;

  @IsString()
  serviceType!: string;

  @IsString()
  vehicleType!: string;

  @IsString()
  paymentMode!: string;

  @IsString()
  pickupSlot!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
