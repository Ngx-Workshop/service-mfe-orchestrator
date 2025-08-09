import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  MfeRemoteType,
  StructuralNavOverrideMode,
  StructuralOverrideMode,
  StructuralOverrides,
  StructuralSubType,
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
  structuralOverridesNav?: StructuralNavOverrideMode;

  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesFooter?: StructuralOverrideMode;

  @IsOptional()
  @IsEnum(StructuralSubType)
  structuralSubType?: StructuralSubType;
}
