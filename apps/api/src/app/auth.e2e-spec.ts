import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { User } from '@nexel/shared-types';

describe('AuthController (E2E)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userModel = moduleFixture.get<Model<User>>('UserModel');
  });

  afterAll(async () => {
    await userModel.db.close();
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it('/auth/register (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'e2e@test.com',
        name: 'E2e User',
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.email).toBe('e2e@test.com');
    expect(res.body.name).toBe('E2e User');
  });

  it('/auth/login (POST) - Success', async () => {
    await userModel.create({
      email: 'login@test.com',
      name: 'Login User',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@test.com',
      })
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
  });

  it('/auth/login (POST) - 401 Unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nonexistent@test.com',
      })
      .expect(401);
  });
});
