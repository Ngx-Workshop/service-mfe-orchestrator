import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RemoteAuthGuard } from '@tmdjr/ngx-auth-client';
import { CreateMfeRemoteDto, MfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { MfeRemoteService } from './mfe-remote.service';

@ApiTags('MFE Remotes')
@Controller('mfe-remotes')
export class MfeRemoteController {
  constructor(private readonly mfeRemoteService: MfeRemoteService) {}

  @Post()
  @UseGuards(RemoteAuthGuard)
  @ApiCreatedResponse({ type: MfeRemoteDto })
  create(@Body() createMfeRemoteDto: CreateMfeRemoteDto) {
    return this.mfeRemoteService.create(createMfeRemoteDto);
  }

  @ApiQuery({
    name: 'archived',
    required: false,
    type: Boolean,
    description: 'Filter by archived status',
  })
  @Get()
  @ApiOkResponse({ type: MfeRemoteDto, isArray: true })
  findAll(@Query('archived') archived?: string) {
    const archivedFilter =
      archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.mfeRemoteService.findAll(archivedFilter);
  }

  @Get(':id')
  @ApiOkResponse({ type: MfeRemoteDto })
  findOne(@Param('id') id: string) {
    return this.mfeRemoteService.findOne(id);
  }

  @Get('name/:name')
  @ApiOkResponse({ type: MfeRemoteDto })
  findByName(@Param('name') name: string) {
    return this.mfeRemoteService.findByName(name);
  }

  @Patch(':id')
  @UseGuards(RemoteAuthGuard)
  @ApiOkResponse({ type: MfeRemoteDto })
  update(
    @Param('id') id: string,
    @Body() updateMfeRemoteDto: UpdateMfeRemoteDto
  ) {
    return this.mfeRemoteService.update(id, updateMfeRemoteDto);
  }

  @Delete(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: string) {
    return this.mfeRemoteService.remove(id);
  }

  @Patch(':id/archive')
  @UseGuards(RemoteAuthGuard)
  @ApiOkResponse({ type: MfeRemoteDto })
  archive(@Param('id') id: string) {
    return this.mfeRemoteService.archive(id);
  }

  @Patch(':id/unarchive')
  @UseGuards(RemoteAuthGuard)
  @ApiOkResponse({ type: MfeRemoteDto })
  unarchive(@Param('id') id: string) {
    return this.mfeRemoteService.unarchive(id);
  }

  @Patch(':id/status')
  @UseGuards(RemoteAuthGuard)
  @ApiOkResponse({ type: MfeRemoteDto })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.mfeRemoteService.updateStatus(id, status);
  }
}
