import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { currentRequestId } from '../observability/observability';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MfeRemote,
  MfeRemoteDocument,
  MfeRemoteDomain,
  MfeRemoteType,
} from './schemas/mfe-remote.schema';
import { CreateMfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { lastValueFrom, of } from 'rxjs';

@Injectable()
export class MfeRemoteService {
  private readonly logger = new Logger(MfeRemoteService.name);

  constructor(
    @InjectModel(MfeRemote.name)
    private mfeRemoteModel: Model<MfeRemoteDocument>
  ) {}

  async authTest(): Promise<{ message: string }> {
    return lastValueFrom(of({ message: 'Authentication successful Service' }));
  }

  async create(createMfeRemoteDto: CreateMfeRemoteDto): Promise<MfeRemote> {
    return this.observeMutation('create', async () => {
      const createdMfeRemote = new this.mfeRemoteModel({
        ...createMfeRemoteDto,
        lastUpdated: new Date(),
      });
      return createdMfeRemote.save();
    });
  }

  async findAll(archived?: boolean): Promise<MfeRemote[]> {
    const filter = archived !== undefined ? { archived } : {};
    return await this.mfeRemoteModel.find(filter).exec();
  }

  async findByDomain(
    domain: MfeRemoteDomain,
    archived?: boolean
  ): Promise<MfeRemote[]> {
    const legacyMembership =
      domain === MfeRemoteDomain.ADMIN
        ? { $or: [{ isAdmin: true }, { type: MfeRemoteType.STRUCTURAL }] }
        : { isAdmin: { $ne: true } };
    return this.mfeRemoteModel
      .find({
        ...(archived !== undefined ? { archived } : {}),
        $or: [
          { domains: domain },
          { domains: { $exists: false }, ...legacyMembership },
        ],
      })
      .exec();
  }

  async findOne(id: string): Promise<MfeRemote> {
    const mfeRemote = await this.mfeRemoteModel.findById(id).exec();
    if (!mfeRemote) {
      throw new NotFoundException(`MFE Remote with ID "${id}" not found`);
    }
    return mfeRemote;
  }

  async findByName(name: string): Promise<MfeRemote> {
    const mfeRemote = await this.mfeRemoteModel.findOne({ name }).exec();
    if (!mfeRemote) {
      throw new NotFoundException(`MFE Remote with name "${name}" not found`);
    }
    return mfeRemote;
  }

  async update(
    id: string,
    updateMfeRemoteDto: UpdateMfeRemoteDto
  ): Promise<MfeRemote> {
    return this.observeMutation('update', async () => {
      const updatedMfeRemote = await this.mfeRemoteModel
        .findByIdAndUpdate(
          id,
          { ...updateMfeRemoteDto, lastUpdated: new Date() },
          { new: true, runValidators: true }
        )
        .exec();

      if (!updatedMfeRemote) {
        throw new NotFoundException(`MFE Remote with ID "${id}" not found`);
      }

      return updatedMfeRemote;
    });
  }

  async remove(id: string): Promise<void> {
    return this.observeMutation('remove', async () => {
      const result = await this.mfeRemoteModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`MFE Remote with ID "${id}" not found`);
      }
    });
  }

  async archive(id: string): Promise<MfeRemote> {
    return await this.update(id, { archived: true });
  }

  async unarchive(id: string): Promise<MfeRemote> {
    return await this.update(id, { archived: false });
  }

  async updateStatus(id: string, status: string): Promise<MfeRemote> {
    return await this.update(id, { status });
  }

  private async observeMutation<T>(
    operation: 'create' | 'update' | 'remove',
    work: () => Promise<T>
  ): Promise<T> {
    const started = process.hrtime.bigint();
    const requestId = currentRequestId();
    const metadata = {
      event: 'mfe_remote_mutation',
      operation,
      operationId: randomUUID(),
      ...(requestId ? { requestId } : {}),
    };
    const durationMs = () =>
      Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    try {
      const result = await work();
      this.logger.log({
        ...metadata,
        outcome: 'success',
        durationMs: durationMs(),
      });
      return result;
    } catch (error: unknown) {
      // Only create/update historically translate duplicate keys to HTTP conflict.
      const failure =
        operation !== 'remove' &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
          ? new ConflictException('MFE Remote with this name already exists')
          : error;
      const status =
        failure instanceof HttpException ? failure.getStatus() : 500;
      const entry = {
        ...metadata,
        outcome: 'failure',
        reason:
          status === 409
            ? 'conflict'
            : status === 404
              ? 'not_found'
              : 'storage_error',
        durationMs: durationMs(),
      };
      if (status < 500) this.logger.warn(entry);
      else this.logger.error(entry);
      throw failure;
    }
  }
}
