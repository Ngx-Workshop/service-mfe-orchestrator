import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import {
  MfeRemoteType, 
  StructuralOverrides,
  StructuralOverrideMode
} from '../schemas/mfe-remote.schema';

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

  @IsEnum(MfeRemoteType)
  @IsNotEmpty()
  type: MfeRemoteType;

  @IsOptional()
  structuralOverrides?: StructuralOverrides;

  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesHeader?: StructuralOverrideMode;

  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesNav?: StructuralOverrideMode;

  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesFooter?: StructuralOverrideMode;
}
