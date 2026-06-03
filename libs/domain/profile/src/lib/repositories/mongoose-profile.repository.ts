import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from '@nexel/shared-types';
import { IProfileRepository } from './profile.repository.interface';

@Injectable()
export class MongooseProfileRepository implements IProfileRepository {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>
  ) {}

  async findByAccountId(accountId: string): Promise<Profile | null> {
    return this.profileModel.findOne({ pubgAccountId: accountId }).exec();
  }

  async findByPlayerTag(playerTag: string): Promise<Profile | null> {
    return this.profileModel.findOne({ pubgPlayerTag: playerTag }).exec();
  }

  async save(profile: Partial<Profile>): Promise<Profile> {
    if (profile.id || (profile as any)._id) {
      const id = profile.id || (profile as any)._id;
      const updated = await this.profileModel
        .findByIdAndUpdate(id, profile, { new: true })
        .exec();
      if (!updated) {
        throw new Error('Falha ao atualizar o perfil: não encontrado.');
      }
      return updated;
    }
    const created = new this.profileModel(profile);
    return created.save();
  }
}
