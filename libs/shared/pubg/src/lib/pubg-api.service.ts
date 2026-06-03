import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PubgApiService {
  private readonly logger = new Logger(PubgApiService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PUBG_API_KEY');
  }

  async fetchPlayerStats(pubgAccountId: string, platform: string): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('PUBG_API_KEY não configurada. Retornando estatísticas mockadas.');
      return {
        kdRatio: 2.45,
        winRate: 15.2,
        headshotRate: 24.8,
        matchesPlayed: 142,
        currentRank: 'Diamond II',
      };
    }

    try {
      const response = await fetch(
        `https://api.pubg.com/shards/${platform}/players/${pubgAccountId}/seasons/lifetime`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API do PUBG: ${response.statusText}`);
      }

      const json: any = await response.json();
      const stats = json.data?.attributes?.gameModeStats?.['squad-fpp'] || {};
      const matches = stats.roundsPlayed || 0;
      const kills = stats.kills || 0;
      const wins = stats.wins || 0;
      const headshots = stats.headshotKills || 0;

      return {
        kdRatio: matches > 0 ? parseFloat((kills / Math.max(matches - wins, 1)).toFixed(2)) : 0,
        winRate: matches > 0 ? parseFloat(((wins / matches) * 100).toFixed(1)) : 0,
        headshotRate: kills > 0 ? parseFloat(((headshots / kills) * 100).toFixed(1)) : 0,
        matchesPlayed: matches,
        currentRank: 'Diamond II',
      };
    } catch (error: any) {
      this.logger.error(`Falha ao buscar dados na API do PUBG: ${error.message}`);
      return {
        kdRatio: 1.80,
        winRate: 10.0,
        headshotRate: 20.0,
        matchesPlayed: 50,
        currentRank: 'Gold I',
      };
    }
  }

  async fetchMatchDetails(matchId: string, platform: string): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('PUBG_API_KEY não configurada. Retornando partida mockada.');
      return {
        data: {
          id: matchId,
          type: 'match',
        },
        included: [
          {
            type: 'participant',
            attributes: {
              stats: {
                playerId: 'account.mocked_id_123',
                winPlace: 1,
                kills: 5,
                damageDealt: 450,
                timeSurvived: 1200,
              },
            },
          },
        ],
      };
    }

    try {
      const response = await fetch(
        `https://api.pubg.com/shards/${platform}/matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar partida: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      this.logger.error(`Falha ao buscar partida na API do PUBG: ${error.message}`);
      throw error;
    }
  }
}
