import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findProfileByUserId, upsertProfile } from '@/repositories/ProfileRepository';
import { findUserById } from '@/repositories/UserRepository';

export default async function ProfileMePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  let profile = await findProfileByUserId(session.user.id);
  if (!profile) {
    const user = await findUserById(session.user.id);
    if (!user) redirect('/login');
    profile = await upsertProfile(session.user.id, {
      game_id: user.freefire_id,
      nickname: user.name,
    });
  }

  redirect(`/profile/${String(profile._id)}`);
}
