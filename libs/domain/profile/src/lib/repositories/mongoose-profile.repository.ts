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

  async findById(id: string): Promise<Profile | null> {
    return this.profileModel.findById(id).exec();
  }

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

  async findFeed(
    filters: { gameStyle?: string; minPotentialScore?: number; minCombatScore?: number },
    limit: number,
    skip: number
  ): Promise<Profile[]> {
    const query: any = {};
    if (filters.gameStyle) {
      query.gameStyle = filters.gameStyle;
    }
    if (filters.minCombatScore) {
      query['scores.combat'] = { $gte: filters.minCombatScore };
    }
    if (filters.minPotentialScore) {
      query['$expr'] = {
        $gte: [
          {
            $avg: [
              { $ifNull: ['$scores.movement', 0] },
              { $ifNull: ['$scores.combat', 0] },
              { $ifNull: ['$scores.rotation', 0] }
            ]
          },
          filters.minPotentialScore
        ]
      };
    }
    return this.profileModel.find(query).skip(skip).limit(limit).exec();
  }

  async findRanking(limit: number): Promise<Profile[]> {
    const results = await this.profileModel.aggregate([
      {
        $addFields: {
          overall_potential_score: {
            $avg: [
              { $ifNull: ['$scores.movement', 0] },
              { $ifNull: ['$scores.combat', 0] },
              { $ifNull: ['$scores.rotation', 0] }
            ]
          }
        }
      },
      { $sort: { overall_potential_score: -1 } },
      { $limit: limit }
    ]).exec();

    return results.map((r) => this.profileModel.hydrate(r));
  }

  async incrementFavoritesCount(profileId: string, amount: number): Promise<Profile | null> {
    return this.profileModel.findByIdAndUpdate(
      profileId,
      { $inc: { favorites_count: amount } },
      { new: true }
    ).exec();
  }
}
