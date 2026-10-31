import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, Role, Roles } from '@tmdjr/ngx-auth-client';
import { AuthType } from '@tmdjr/ngx-auth-client/enums/auth-type.enum';
import { CreateMfeRemoteDto, MfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { MfeRemoteDomain } from './schemas/mfe-remote.schema';
import { MfeRemoteService } from './mfe-remote.service';

@ApiTags('MFE Remotes')
@Controller('mfe-remotes')
export class MfeRemoteController {
  constructor(private readonly mfeRemoteService: MfeRemoteService) {}

  @Post()
  @Roles(Role.Admin)
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
  @Auth(AuthType.None)
  @ApiOkResponse({ type: MfeRemoteDto, isArray: true })
  findAll(@Query('archived') archived?: string) {
    const archivedFilter =
      archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.mfeRemoteService.findAll(archivedFilter);
  }

  @Get('domain/:domain')
  @Auth(AuthType.None)
  @ApiParam({
    name: 'domain',
    enum: MfeRemoteDomain,
    enumName: 'MfeRemoteDomain',
  })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @ApiOkResponse({ type: MfeRemoteDto, isArray: true })
  findByDomain(
    @Param('domain', new ParseEnumPipe(MfeRemoteDomain))
    domain: MfeRemoteDomain,
    @Query('archived') archived?: string
  ) {
    const archivedFilter =
      archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.mfeRemoteService.findByDomain(domain, archivedFilter);
  }

  @Get(':id')
  @Auth(AuthType.None)
  @ApiOkResponse({ type: MfeRemoteDto })
  findOne(@Param('id') id: string) {
    return this.mfeRemoteService.findOne(id);
  }

  @Get('name/:name')
  @Auth(AuthType.None)
  @ApiOkResponse({ type: MfeRemoteDto })
  findByName(@Param('name') name: string) {
    return this.mfeRemoteService.findByName(name);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOkResponse({ type: MfeRemoteDto })
  update(
    @Param('id') id: string,
    @Body() updateMfeRemoteDto: UpdateMfeRemoteDto
  ) {
    return this.mfeRemoteService.update(id, updateMfeRemoteDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: string) {
    return this.mfeRemoteService.remove(id);
  }

  @Patch(':id/archive')
  @Roles(Role.Admin)
  @ApiOkResponse({ type: MfeRemoteDto })
  archive(@Param('id') id: string) {
    return this.mfeRemoteService.archive(id);
  }

  @Patch(':id/unarchive')
  @Roles(Role.Admin)
  @ApiOkResponse({ type: MfeRemoteDto })
  unarchive(@Param('id') id: string) {
    return this.mfeRemoteService.unarchive(id);
  }

  @Patch(':id/status')
  @Roles(Role.Admin)
  @ApiOkResponse({ type: MfeRemoteDto })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.mfeRemoteService.updateStatus(id, status);
  }
}
