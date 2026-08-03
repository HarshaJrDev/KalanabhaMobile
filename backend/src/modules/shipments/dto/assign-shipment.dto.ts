import { IsString } from 'class-validator';

export class AssignShipmentDto {
  @IsString()
  driverId!: string;
}
