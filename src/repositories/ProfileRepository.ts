import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Profile, IProfile, IBooyahVictory } from '@/models/Profile';

export interface ProfileFilters {
  search?: string;
  minScore?: number;
  rank?: string;
  sortBy?: 'global_score' | 'wins' | 'headshot_rate';
  /** When provided, only profiles whose _id is in this list are returned */
  favoritedIds?: string[];
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 * Ex.: "João" → "joao", "AÇÃO" → "acao"
 */
function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Constrói um RegExp que realiza busca parcial, case-insensitive e accent-insensitive.
 * Ex.: buscar "joao" encontra "João", "JOAO", "joão", "joão" etc.
 */
function buildSearchRegex(search: string): RegExp {
  // Mapa de caracteres sem acento → classe de regex que cobre todas as variações
  const accentMap: Record<string, string> = {
    a: '[aáàâãäå]',
    e: '[eéèêë]',
    i: '[iíìîï]',
    o: '[oóòôõö]',
    u: '[uúùûü]',
    c: '[cç]',
    n: '[nñ]',
  };

  const normalized = normalizeText(search);
  // Escapa caracteres especiais de regex antes de montar o padrão
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped
    .split('')
    .map((char) => accentMap[char] ?? char)
    .join('');

  return new RegExp(pattern, 'i');
}

export async function findProfiles(
  filters: ProfileFilters = {},
  limit = 25,
  page = 1
): Promise<{ profiles: IProfile[]; hasMore: boolean }> {
  await dbConnect();
  const query: Record<string, unknown> = {};

  if (filters.search) {
    query.nickname = { $regex: buildSearchRegex(filters.search) };
  }
  if (filters.rank) {
    query.rank = filters.rank;
  }
  if (typeof filters.minScore === 'number') {
    query.global_score = { $gte: filters.minScore };
  }
  if (filters.favoritedIds && filters.favoritedIds.length > 0) {
    query._id = { $in: filters.favoritedIds.map((id) => new mongoose.Types.ObjectId(id)) };
  } else if (filters.favoritedIds && filters.favoritedIds.length === 0) {
    return { profiles: [], hasMore: false };
  }

  const sort: Record<string, 1 | -1> = {};
  switch (filters.sortBy) {
    case 'wins':
      sort['metrics.wins'] = -1;
      break;
    case 'headshot_rate':
      sort['metrics.headshot_rate'] = -1;
      break;
    default:
      sort['global_score'] = -1;
  }

  const skip = (page - 1) * limit;
  const raw = await Profile.find(query).sort(sort).skip(skip).limit(limit + 1).lean();
  const hasMore = raw.length > limit;
  return { profiles: hasMore ? raw.slice(0, limit) : raw, hasMore };
}

export async function findProfileById(id: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findById(id).lean();
}

export async function findProfileByUserId(userId: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findOne({ user_id: userId }).lean();
}

export interface ProfileSettingsInput {
  nickname?: string;
  contact_info?: {
    discord?: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
  };
}

export async function updateProfileSettings(
  userId: string,
  data: ProfileSettingsInput
): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findOneAndUpdate(
    { user_id: userId },
    { $set: data },
    { returnDocument: 'after' }
  ).lean();
}

export async function upsertProfile(
  userId: string,
  data: Partial<Omit<IProfile, '_id' | 'user_id' | 'createdAt' | 'updatedAt'>>
): Promise<IProfile> {
  await dbConnect();
  const profile = await Profile.findOneAndUpdate(
    { user_id: userId },
    { $set: { user_id: userId, ...data } },
    { upsert: true, returnDocument: 'after' }
  );
  return profile;
}

/**
 * Appends a new AI score entry to the profile's history and updates the current global_score.
 * Called after every successful AI analysis to keep evolution charts up-to-date.
 */
export async function addAiScoreToHistory(
  profileId: string,
  score: number
): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findByIdAndUpdate(
    profileId,
    {
      $set: { global_score: score },
      $push: {
        ai_score_history: {
          $each: [{ score, date: new Date() }],
          $slice: -50, // Keep only the last 50 entries to control document size
        },
      },
    },
    { returnDocument: 'after' }
  ).lean();
}

/**
 * Increments win or loss count after a RANKED match completes.
 */
export async function recordMatchResult(
  profileId: string,
  result: 'win' | 'loss'
): Promise<IProfile | null> {
  await dbConnect();
  const inc: Record<string, number> = { 'metrics.matches_played': 1 };
  if (result === 'win') inc['metrics.wins'] = 1;
  else inc['metrics.losses'] = 1;
  return Profile.findByIdAndUpdate(profileId, { $inc: inc }, { returnDocument: 'after' }).lean();
}
/**
 * Toggles a specific analysis ID in the profile's highlights and enforces the MAX_HIGHLIGHTS limit.
 * Returns the updated highlight list and whether it was added or removed.
 */
export async function toggleAnalysisHighlight(
  profileId: string,
  analysisId: string
): Promise<{ highlighted: boolean; highlightedIds: string[] }> {
  await dbConnect();
  const MAX_HIGHLIGHTS = 5;

  const profile = await Profile.findById(profileId);
  if (!profile) throw new Error('Perfil não encontrado');

  const objectId = new mongoose.Types.ObjectId(analysisId);
  const currentHighlights = profile.highlighted_analysis_ids ?? [];
  const isHighlighted = currentHighlights.some((id) => id.equals(objectId));

  if (isHighlighted) {
    // Remove from highlights
    profile.highlighted_analysis_ids = currentHighlights.filter((id) => !id.equals(objectId));
  } else {
    // Add — enforce max
    if (currentHighlights.length >= MAX_HIGHLIGHTS) {
      throw new Error(`Máximo de ${MAX_HIGHLIGHTS} destaques atingido`);
    }
    profile.highlighted_analysis_ids = [...currentHighlights, objectId];
  }

  await profile.save();
  return {
    highlighted: !isHighlighted,
    highlightedIds: profile.highlighted_analysis_ids.map((id) => id.toString()),
  };
}

// ─── Favorites ───────────────────────────────────────────────────────────────

/**
 * Adjusts the denormalized favorites_count by +1 or -1.
 */
export async function adjustFavoritesCount(
  profileId: string,
  delta: 1 | -1
): Promise<void> {
  await dbConnect();
  await Profile.findByIdAndUpdate(profileId, { $inc: { favorites_count: delta } });
}

// ─── Booyah ──────────────────────────────────────────────────────────────────

const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

function getMidnightBrasilia(): Date {
  const nowUtc = Date.now();
  const nowBrasilia = nowUtc - BRASILIA_OFFSET_MS;
  const midnightBrasiliaMs = nowBrasilia - (nowBrasilia % (24 * 60 * 60 * 1000));
  return new Date(midnightBrasiliaMs + BRASILIA_OFFSET_MS);
}

export interface BooyahDailyState {
  dailyCount: number;
  resetAt: Date;
}

/**
 * Returns the current booyah daily count, applying a reset if the day has changed
 * (midnight Brasília UTC-3). Does NOT mutate the document.
 */
export async function getBooyahDailyState(profileId: string): Promise<BooyahDailyState> {
  await dbConnect();
  const profile = await Profile.findById(profileId).lean();
  if (!profile) return { dailyCount: 0, resetAt: new Date() };

  const midnightBrasilia = getMidnightBrasilia();
  const lastReset = profile.booyah_daily_reset ? new Date(profile.booyah_daily_reset) : new Date(0);
  const needsReset = lastReset < midnightBrasilia;

  return {
    dailyCount: needsReset ? 0 : (profile.booyah_daily_count ?? 0),
    resetAt: midnightBrasilia,
  };
}

/**
 * Increments the booyah daily counter, resetting it first if the day changed.
 * Called once per submission, before Gemini analysis (counts regardless of outcome).
 */
export async function incrementBooyahDailyCount(profileId: string): Promise<void> {
  await dbConnect();
  const midnightBrasilia = getMidnightBrasilia();

  const profile = await Profile.findById(profileId);
  if (!profile) return;

  const lastReset = profile.booyah_daily_reset ? new Date(profile.booyah_daily_reset) : new Date(0);

  if (lastReset < midnightBrasilia) {
    profile.booyah_daily_count = 1;
    profile.booyah_daily_reset = new Date();
  } else {
    profile.booyah_daily_count = (profile.booyah_daily_count ?? 0) + 1;
  }

  await profile.save();
}

/**
 * Returns true if the user already submitted this exact print (per-user scope).
 */
export async function isBooyahVictoryDuplicate(profileId: string, contentHash: string): Promise<boolean> {
  await dbConnect();
  const profile = await Profile.findById(profileId).lean();
  if (!profile) return false;
  return (profile.booyah_victories ?? []).some((v) => v.content_hash === contentHash);
}

/**
 * Pushes a validated Booyah victory into the player's profile.
 */
export async function addBooyahVictory(
  profileId: string,
  victory: Omit<IBooyahVictory, 'date'>
): Promise<void> {
  await dbConnect();
  await Profile.findByIdAndUpdate(profileId, {
    $push: {
      booyah_victories: { ...victory, date: new Date() },
    },
  });
}

/**
 * Returns the player's booyah victories, optionally filtered by month and year.
 */
export async function findBooyahVictories(
  profileId: string,
  filter?: { month?: number; year?: number }
): Promise<IBooyahVictory[]> {
  await dbConnect();
  const profile = await Profile.findById(profileId).lean();
  if (!profile) return [];

  let victories = profile.booyah_victories ?? [];

  if (filter?.year !== undefined) {
    victories = victories.filter((v) => new Date(v.date).getFullYear() === filter.year);
  }
  if (filter?.month !== undefined) {
    victories = victories.filter((v) => new Date(v.date).getMonth() + 1 === filter.month);
  }

  return victories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
