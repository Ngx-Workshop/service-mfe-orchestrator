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
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RemoteAuthGuard } from '@tmdjr/ngx-auth-client';
import { CreateMfeRemoteDto, MfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { MfeRemoteService } from './mfe-remote.service';

export class AuthTestDto {
  @ApiProperty()
  message: string;
}

@ApiTags('MFE Remotes')
@Controller('mfe-remotes')
export class MfeRemoteController {
  constructor(private readonly mfeRemoteService: MfeRemoteService) {}

  @Get('auth-test')
  @UseGuards(RemoteAuthGuard)
  @ApiOkResponse({ type: AuthTestDto })
  authTest() {
    return this.mfeRemoteService.authTest();
  }

  @Post()
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
  @ApiOkResponse({ type: MfeRemoteDto })
  update(
    @Param('id') id: string,
    @Body() updateMfeRemoteDto: UpdateMfeRemoteDto
  ) {
    return this.mfeRemoteService.update(id, updateMfeRemoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: string) {
    return this.mfeRemoteService.remove(id);
  }

  @Patch(':id/archive')
  @ApiOkResponse({ type: MfeRemoteDto })
  archive(@Param('id') id: string) {
    return this.mfeRemoteService.archive(id);
  }

  @Patch(':id/unarchive')
  @ApiOkResponse({ type: MfeRemoteDto })
  unarchive(@Param('id') id: string) {
    return this.mfeRemoteService.unarchive(id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ type: MfeRemoteDto })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.mfeRemoteService.updateStatus(id, status);
  }
}
