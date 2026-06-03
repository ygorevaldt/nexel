import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { Model, Types } from 'mongoose';
import { Profile, User } from '@nexel/shared-types';
import { JwtService } from '@nestjs/jwt';

describe('ProfileController (E2E)', () => {
  let app: INestApplication;
  let profileModel: Model<Profile>;
  let userModel: Model<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    profileModel = moduleFixture.get<Model<Profile>>('ProfileModel');
    userModel = moduleFixture.get<Model<User>>('UserModel');
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await profileModel.db.close();
    await app.close();
  });

  beforeEach(async () => {
    await profileModel.deleteMany({});
    await userModel.deleteMany({});
  });

  it('/profile/:id (GET) - Restricted response for FREE users', async () => {
    const ownerUserId = new Types.ObjectId();
    const owner = await userModel.create({
      _id: ownerUserId,
      email: 'owner@test.com',
      name: 'Owner Player',
    });

    const profile = await profileModel.create({
      userId: ownerUserId,
      name: 'Owner Player',
      pubgAccountId: 'account_owner',
      pubgPlayerTag: 'OwnerPlayer',
      scores: { movement: 80, combat: 85, rotation: 90 },
    });

    const viewerUserId = new Types.ObjectId();
    const viewer = await userModel.create({
      _id: viewerUserId,
      email: 'viewer@test.com',
      name: 'Viewer Player',
      subscriptionStatus: 'FREE',
    });

    const token = jwtService.sign({ sub: String(viewerUserId), email: viewer.email });

    const res = await request(app.getHttpServer())
      .get(`/profile/${profile.id || (profile as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.isRestricted).toBe(true);
    expect(res.body.scores.combat).toBeNull();
    expect(res.body.scores.movement).toBeNull();
  });

  it('/profile/:id (GET) - Full response for owner', async () => {
    const ownerUserId = new Types.ObjectId();
    const owner = await userModel.create({
      _id: ownerUserId,
      email: 'owner@test.com',
      name: 'Owner Player',
      subscriptionStatus: 'FREE',
    });

    const profile = await profileModel.create({
      userId: ownerUserId,
      name: 'Owner Player',
      pubgAccountId: 'account_owner',
      pubgPlayerTag: 'OwnerPlayer',
      scores: { movement: 80, combat: 85, rotation: 90 },
    });

    const token = jwtService.sign({ sub: String(ownerUserId), email: owner.email });

    const res = await request(app.getHttpServer())
      .get(`/profile/${profile.id || (profile as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.isRestricted).toBeUndefined();
    expect(res.body.scores.combat).toBe(85);
  });
});
