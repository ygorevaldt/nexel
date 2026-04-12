import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Profile, IProfile } from '@/models/Profile';

export interface ProfileFilters {
  search?: string;
  minScore?: number;
  rank?: string;
  sortBy?: 'global_score' | 'wins' | 'headshot_rate';
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
  limit = 20
): Promise<IProfile[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};

  if (filters.search) {
    // Busca parcial, case-insensitive e accent-insensitive no campo nickname
    query.nickname = { $regex: buildSearchRegex(filters.search) };
  }
  if (filters.rank) {
    query.rank = filters.rank;
  }
  if (typeof filters.minScore === 'number') {
    query.global_score = { $gte: filters.minScore };
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

  return Profile.find(query).limit(limit).sort(sort).lean();
}

export async function findProfileById(id: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findById(id).lean();
}

export async function findProfileByUserId(userId: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findOne({ user_id: userId }).lean();
}

export async function upsertProfile(
  userId: string,
  data: Partial<Omit<IProfile, '_id' | 'user_id' | 'createdAt' | 'updatedAt'>>
): Promise<IProfile> {
  await dbConnect();
  const profile = await Profile.findOneAndUpdate(
    { user_id: userId },
    { $set: { user_id: userId, ...data } },
    { upsert: true, new: true }
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
    { new: true }
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
  return Profile.findByIdAndUpdate(profileId, { $inc: inc }, { new: true }).lean();
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
