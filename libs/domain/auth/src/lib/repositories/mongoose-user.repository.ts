import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@nexel/shared-types';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async save(user: Partial<User>): Promise<User> {
    if (user.id || (user as any)._id) {
      const id = user.id || (user as any)._id;
      const updated = await this.userModel
        .findByIdAndUpdate(id, user, { new: true })
        .exec();
      if (!updated) {
        throw new Error('Falha ao atualizar o usuário: não encontrado.');
      }
      return updated;
    }
    const created = new this.userModel(user);
    return created.save();
  }
}
