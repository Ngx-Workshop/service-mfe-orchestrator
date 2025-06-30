import { PartialType } from '@nestjs/mapped-types';
import { CreateMfeRemoteDto } from './create-mfe-remote.dto';

export class UpdateMfeRemoteDto extends PartialType(CreateMfeRemoteDto) {}
