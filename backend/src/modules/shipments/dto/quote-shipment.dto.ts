import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

class GeoPointDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class QuoteShipmentDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  pickup!: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  drop!: GeoPointDto;

  @IsString()
  vehicleType!: string;

  @IsString()
  serviceType!: string;
}
