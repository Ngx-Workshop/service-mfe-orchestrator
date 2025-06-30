import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MfeRemoteService } from './mfe-remote.service';
import { CreateMfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';

@Controller('mfe-remotes')
export class MfeRemoteController {
  constructor(private readonly mfeRemoteService: MfeRemoteService) {}

  @Post()
  create(@Body() createMfeRemoteDto: CreateMfeRemoteDto) {
    return this.mfeRemoteService.create(createMfeRemoteDto);
  }

  @Get()
  findAll(@Query('archived') archived?: string) {
    const archivedFilter = archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.mfeRemoteService.findAll(archivedFilter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mfeRemoteService.findOne(id);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.mfeRemoteService.findByName(name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMfeRemoteDto: UpdateMfeRemoteDto) {
    return this.mfeRemoteService.update(id, updateMfeRemoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.mfeRemoteService.remove(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.mfeRemoteService.archive(id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.mfeRemoteService.unarchive(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.mfeRemoteService.updateStatus(id, status);
  }
}
