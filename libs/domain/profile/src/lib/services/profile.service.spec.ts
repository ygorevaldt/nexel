import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { IProfileRepositoryToken } from '../repositories/profile.repository.interface';
import { PubgApiService } from '@nexel/shared-pubg';
import { NotFoundException } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockRepository: any;
  let mockPubgApiService: any;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByAccountId: jest.fn(),
      findByPlayerTag: jest.fn(),
      save: jest.fn(),
      findFeed: jest.fn(),
      findRanking: jest.fn(),
      incrementFavoritesCount: jest.fn(),
    };

    mockPubgApiService = {
      fetchPlayerStats: jest.fn(),
      fetchMatchDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: IProfileRepositoryToken,
          useValue: mockRepository,
        },
        {
          provide: PubgApiService,
          useValue: mockPubgApiService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProfileForViewer', () => {
    it('should throw NotFoundException if profile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.findProfileForViewer('nonexistent', { id: 'user123' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should return full profile if viewer is the owner', async () => {
      const mockProfile = {
        _id: 'profile123',
        id: 'profile123',
        userId: 'user123',
        pubgAccountId: 'account123',
        lastSyncedAt: new Date(),
        scores: { movement: 80, combat: 85, rotation: 90 },
      };
      mockRepository.findById.mockResolvedValue(mockProfile);

      const result = await service.findProfileForViewer('profile123', { id: 'user123', subscriptionStatus: 'FREE' } as any);
      expect(result).toEqual(mockProfile);
      expect(result.isRestricted).toBeUndefined();
    });

    it('should return restricted profile if viewer is FREE and not the owner', async () => {
      const mockProfile = {
        _id: 'profile123',
        id: 'profile123',
        userId: 'owner123',
        name: 'Shroud',
        pubgPlayerTag: 'Shroud',
        pubgAccountId: 'account123',
        lastSyncedAt: new Date(),
        scores: { movement: 80, combat: 85, rotation: 90 },
        stats: { kdRatio: 3.5 },
      };
      mockRepository.findById.mockResolvedValue(mockProfile);

      const result = await service.findProfileForViewer('profile123', { id: 'viewer123', subscriptionStatus: 'FREE' } as any);
      expect(result.isRestricted).toBe(true);
      expect(result.scores.combat).toBeNull();
      expect(result.scores.movement).toBeNull();
      expect(result.scores.rotation).toBeNull();
    });

    it('should sync stats if cache is older than 15 minutes', async () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const mockProfile = {
        _id: 'profile123',
        id: 'profile123',
        userId: 'user123',
        pubgAccountId: 'account123',
        platform: 'steam',
        lastSyncedAt: oldDate,
        scores: { movement: 80, combat: 85, rotation: 90 },
        stats: {},
      };
      const freshStats = { kdRatio: 4.2 };
      
      mockRepository.findById.mockResolvedValue(mockProfile);
      mockPubgApiService.fetchPlayerStats.mockResolvedValue(freshStats);
      mockRepository.save.mockImplementation((p: any) => Promise.resolve(p));

      await service.findProfileForViewer('profile123', { id: 'user123' } as any);

      expect(mockPubgApiService.fetchPlayerStats).toHaveBeenCalledWith('account123', 'steam');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockProfile.stats).toEqual(freshStats);
    });
  });
});
