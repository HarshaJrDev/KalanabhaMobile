import { IsBoolean } from 'class-validator';

export class SetOnlineStatusDto {
  @IsBoolean()
  isOnline!: boolean;
}
