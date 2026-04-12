import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findProfileByUserId } from '@/repositories/ProfileRepository';

export default async function ProfileMePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await findProfileByUserId(session.user.id);
  if (!profile) {
    redirect('/dashboard');
  }

  redirect(`/profile/${String(profile._id)}`);
}
