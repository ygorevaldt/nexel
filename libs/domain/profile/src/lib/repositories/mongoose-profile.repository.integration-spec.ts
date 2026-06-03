import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@nexel/shared-database';
import { Profile, ProfileSchema } from '@nexel/shared-types';
import { MongooseProfileRepository } from './mongoose-profile.repository';
import { IProfileRepositoryToken } from './profile.repository.interface';
import { Model, Types } from 'mongoose';

describe('MongooseProfileRepository Integration Test', () => {
  let repository: MongooseProfileRepository;
  let profileModel: Model<Profile>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
      ],
      providers: [
        MongooseProfileRepository,
        {
          provide: IProfileRepositoryToken,
          useClass: MongooseProfileRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get<MongooseProfileRepository>(MongooseProfileRepository);
    profileModel = moduleRef.get<Model<Profile>>('ProfileModel');
  });

  afterAll(async () => {
    await profileModel.db.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await profileModel.deleteMany({});
  });

  it('should find feed with filters', async () => {
    const userId1 = new Types.ObjectId();
    const userId2 = new Types.ObjectId();

    await profileModel.create([
      {
        userId: userId1,
        name: 'Player One',
        pubgAccountId: 'account1',
        pubgPlayerTag: 'One',
        gameStyle: 'Rusher',
        scores: { combat: 90, movement: 80, rotation: 70 },
      },
      {
        userId: userId2,
        name: 'Player Two',
        pubgAccountId: 'account2',
        pubgPlayerTag: 'Two',
        gameStyle: 'Sniper',
        scores: { combat: 60, movement: 60, rotation: 65 },
      },
    ]);

    const feed = await repository.findFeed({ gameStyle: 'Rusher' }, 10, 0);
    expect(feed.length).toBe(1);
    expect(feed[0].name).toBe('Player One');

    const feedCombat = await repository.findFeed({ minCombatScore: 70 }, 10, 0);
    expect(feedCombat.length).toBe(1);
    expect(feedCombat[0].name).toBe('Player One');
  });

  it('should increment favorites_count atomically', async () => {
    const userId = new Types.ObjectId();
    const profile = await profileModel.create({
      userId,
      name: 'Player Fav',
      pubgAccountId: 'account_fav',
      pubgPlayerTag: 'Fav',
      favorites_count: 0,
    });

    const profileId = profile.id || (profile as any)._id;

    await repository.incrementFavoritesCount(String(profileId), 1);
    const retrieved = await repository.findById(String(profileId));
    expect(retrieved?.favorites_count).toBe(1);

    await repository.incrementFavoritesCount(String(profileId), -1);
    const retrieved2 = await repository.findById(String(profileId));
    expect(retrieved2?.favorites_count).toBe(0);
  });
});
