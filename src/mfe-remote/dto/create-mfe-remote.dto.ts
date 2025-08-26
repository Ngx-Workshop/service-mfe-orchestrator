import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

/** ---- NEW: response/helper DTOs ---- */
export class StructuralOverridesDto {
  @ApiPropertyOptional({ enum: StructuralOverrideMode })
  header?: StructuralOverrideMode;

  @ApiPropertyOptional({ enum: StructuralNavOverrideMode })
  nav?: StructuralNavOverrideMode;

  @ApiPropertyOptional({ enum: StructuralOverrideMode })
  footer?: StructuralOverrideMode;
}

export class MfeRemoteDto {
  @ApiProperty() _id: string;
  @ApiProperty() name: string;
  @ApiProperty({ format: 'uri' }) remoteEntryUrl: string;
  @ApiProperty({ enum: MfeRemoteType }) type: MfeRemoteType;
  @ApiPropertyOptional({ type: StructuralOverridesDto })
  structuralOverrides?: StructuralOverridesDto;
  @ApiPropertyOptional({ enum: StructuralSubType })
  structuralSubType?: StructuralSubType;
  @ApiProperty() version: number;
  @ApiPropertyOptional() status?: string;
  @ApiProperty() description: string;
  @ApiProperty({ type: String, format: 'date-time' }) lastUpdated: string;
  @ApiProperty() archived: boolean;
  @ApiProperty() __v: number;
}

export class CreateMfeRemoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ format: 'uri' })
  @IsUrl()
  @IsNotEmpty()
  remoteEntryUrl: string;

  // @IsNumber()
  // @IsNotEmpty()
  // version: number; // Auto-incremented by the schema

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @ApiProperty({ enum: MfeRemoteType, enumName: 'MfeRemoteType' })
  @IsEnum(MfeRemoteType)
  @IsNotEmpty()
  type: MfeRemoteType;

  /** CHANGED: use DTO type instead of inline object */
  @ApiPropertyOptional({ type: StructuralOverridesDto })
  @IsOptional()
  structuralOverrides?: StructuralOverrides;

  @ApiPropertyOptional({
    enum: StructuralOverrideMode,
    enumName: 'StructuralOverrideMode',
  })
  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesHeader?: StructuralOverrideMode;

  @ApiPropertyOptional({
    enum: StructuralNavOverrideMode,
    enumName: 'StructuralNavOverrideMode',
  })
  @IsEnum(StructuralNavOverrideMode)
  @IsOptional()
  structuralOverridesNav?: StructuralNavOverrideMode;

  @ApiPropertyOptional({
    enum: StructuralOverrideMode,
    enumName: 'StructuralOverrideMode',
  })
  @IsEnum(StructuralOverrideMode)
  @IsOptional()
  structuralOverridesFooter?: StructuralOverrideMode;

  @ApiPropertyOptional({
    enum: StructuralSubType,
    enumName: 'StructuralSubType',
  })
  @IsOptional()
  @IsEnum(StructuralSubType)
  structuralSubType?: StructuralSubType;
}
