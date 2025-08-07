import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MfeRemote, MfeRemoteDocument } from './schemas/mfe-remote.schema';
import { CreateMfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { lastValueFrom, of } from 'rxjs';

@Injectable()
export class MfeRemoteService {
  constructor(
    @InjectModel(MfeRemote.name)
    private mfeRemoteModel: Model<MfeRemoteDocument>,
  ) {}


  async authTest(): Promise<{ message: string }> {
    return lastValueFrom(of({ message: 'Authentication successful Service' }));
  }

  async create(createMfeRemoteDto: CreateMfeRemoteDto): Promise<MfeRemote> {
    try {
      const createdMfeRemote = new this.mfeRemoteModel({
        ...createMfeRemoteDto,
        lastUpdated: new Date(),
      });
      return await createdMfeRemote.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('MFE Remote with this name already exists');
      }
      throw error;
    }
  }

  async findAll(archived?: boolean): Promise<MfeRemote[]> {
    const filter = archived !== undefined ? { archived } : {};
    return await this.mfeRemoteModel.find(filter).exec();
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
    updateMfeRemoteDto: UpdateMfeRemoteDto,
  ): Promise<MfeRemote> {
    try {
      const updatedMfeRemote = await this.mfeRemoteModel
        .findByIdAndUpdate(
          id,
          { ...updateMfeRemoteDto, lastUpdated: new Date() },
          { new: true },
        )
        .exec();

      if (!updatedMfeRemote) {
        throw new NotFoundException(`MFE Remote with ID "${id}" not found`);
      }

      return updatedMfeRemote;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('MFE Remote with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.mfeRemoteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`MFE Remote with ID "${id}" not found`);
    }
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
}
