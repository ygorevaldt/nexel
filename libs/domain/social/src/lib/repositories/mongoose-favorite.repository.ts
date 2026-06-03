import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from '@nexel/shared-types';
import { IFavoriteRepository } from './favorite.repository.interface';

@Injectable()
export class MongooseFavoriteRepository implements IFavoriteRepository {
  constructor(
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<Favorite>
  ) {}

  async findOne(scoutUserId: string, targetProfileId: string): Promise<Favorite | null> {
    return this.favoriteModel.findOne({ scoutUserId, targetProfileId }).exec();
  }

  async create(scoutUserId: string, targetProfileId: string): Promise<Favorite> {
    const created = new this.favoriteModel({ scoutUserId, targetProfileId });
    return created.save();
  }

  async deleteOne(id: string): Promise<void> {
    await this.favoriteModel.deleteOne({ _id: id }).exec();
  }
}
