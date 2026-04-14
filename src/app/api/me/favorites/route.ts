import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findProfileById } from '@/repositories/ProfileRepository';
import { adjustFavoritesCount } from '@/repositories/ProfileRepository';
import {
  findUserById,
  getFavoritedProfileIds,
  isFavorited,
  addFavorite,
  removeFavorite,
} from '@/repositories/UserRepository';

const ToggleSchema = z.object({
  profileId: z.string().min(1),
});

/**
 * GET /api/me/favorites
 * Returns the list of profile IDs the authenticated user has favorited.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const profileIds = await getFavoritedProfileIds(session.user.id);
    return NextResponse.json({ profileIds });
  } catch (error) {
    console.error('[GET /api/me/favorites]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}

/**
 * POST /api/me/favorites
 * Toggles the favorite state for a given profile.
 * Returns { favorited: boolean, favorites_count: number }.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = ToggleSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { profileId } = body.data;

    const [profile, viewer] = await Promise.all([
      findProfileById(profileId),
      findUserById(session.user.id),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Block self-favorite by comparing Free Fire IDs registered at signup
    if (viewer?.freefire_id && viewer.freefire_id === profile.game_id) {
      return NextResponse.json(
        { error: 'Você não pode favoritar o seu próprio perfil.' },
        { status: 400 }
      );
    }

    const alreadyFavorited = await isFavorited(session.user.id, profileId);

    if (alreadyFavorited) {
      await removeFavorite(session.user.id, profileId);
      await adjustFavoritesCount(profileId, -1);
    } else {
      await addFavorite(session.user.id, profileId);
      await adjustFavoritesCount(profileId, 1);
    }

    const updatedProfile = await findProfileById(profileId);
    const newCount = updatedProfile?.favorites_count ?? 0;

    return NextResponse.json({ favorited: !alreadyFavorited, favorites_count: newCount });
  } catch (error) {
    console.error('[POST /api/me/favorites]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
