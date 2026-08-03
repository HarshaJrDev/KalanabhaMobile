import { IsBoolean } from 'class-validator';

export class SetDocumentsVerifiedDto {
  @IsBoolean()
  documentsVerified!: boolean;
}
