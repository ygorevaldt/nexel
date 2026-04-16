import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findUserById, updateUserPassword } from '@/repositories/UserRepository';

const PASSWORD_MIN_LENGTH = 6;
const BCRYPT_SALT_ROUNDS = 10;

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = ChangePasswordSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { currentPassword, newPassword } = body.data;

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await updateUserPassword(session.user.id, newPasswordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/me/password]', error);
    return NextResponse.json({ error: 'Falha ao atualizar senha' }, { status: 500 });
  }
}
