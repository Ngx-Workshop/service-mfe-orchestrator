import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsBoolean,
} from 'class-validator';

export class CreateMfeRemoteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  remoteEntryUrl: string;

  // @IsNumber()
  // @IsNotEmpty()
  // version: number; // Auto-incremented by the schema

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
