import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUserService = {
      findByEmail: vi.fn(),
      createUser: vi.fn(),
      findById: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue({ email: 'test@example.com' });

      await expect(service.register('test@example.com', 'Test User'))
        .rejects.toThrow(ConflictException);
    });

    it('should successfully create a new user', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      const mockCreatedUser = {
        email: 'test@example.com',
        name: 'Test User',
        subscriptionStatus: 'FREE',
      };
      mockUserService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await service.register('test@example.com', 'Test User');
      expect(result).toEqual(mockCreatedUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        subscriptionStatus: 'FREE',
        systemRole: 'USER',
        welcome_analysis_credits: 0,
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login('test@example.com'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if user is found', async () => {
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        email: 'test@example.com',
      };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt_token_123');

      const result = await service.login('test@example.com');
      expect(result).toEqual({
        accessToken: 'jwt_token_123',
        user: mockUser,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user123',
        email: 'test@example.com',
      });
    });
  });
});
