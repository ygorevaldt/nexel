import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@nexel/shared-database';
import { User, UserSchema } from '@nexel/shared-types';
import { MongooseUserRepository } from './mongoose-user.repository';
import { IUserRepositoryToken } from './user.repository.interface';
import { Model } from 'mongoose';

describe('MongooseUserRepository Integration Test', () => {
  let repository: MongooseUserRepository;
  let userModel: Model<User>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [
        MongooseUserRepository,
        {
          provide: IUserRepositoryToken,
          useClass: MongooseUserRepository,
        },
      ],
    }).compile();

    repository = moduleRef.get<MongooseUserRepository>(MongooseUserRepository);
    userModel = moduleRef.get<Model<User>>('UserModel');
  });

  afterAll(async () => {
    await userModel.db.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it('should save and retrieve a user', async () => {
    const saved = await repository.save({
      email: 'integration@test.com',
      name: 'Integration Test User',
      subscriptionStatus: 'PRO',
      systemRole: 'USER',
    });

    expect(saved).toBeDefined();
    expect(saved.email).toBe('integration@test.com');

    const retrieved = await repository.findByEmail('integration@test.com');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Integration Test User');
    expect(retrieved?.subscriptionStatus).toBe('PRO');
  });

  it('should find user by id', async () => {
    const created = await userModel.create({
      email: 'idtest@test.com',
      name: 'Id Test User',
    });

    const retrieved = await repository.findById(created.id || (created as any)._id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.email).toBe('idtest@test.com');
  });
});
