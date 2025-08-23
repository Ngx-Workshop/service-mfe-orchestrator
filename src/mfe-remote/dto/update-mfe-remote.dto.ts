import { PartialType } from '@nestjs/swagger';
import { CreateMfeRemoteDto } from './create-mfe-remote.dto';

export class UpdateMfeRemoteDto extends PartialType(CreateMfeRemoteDto) {}
