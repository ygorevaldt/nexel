import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { checkUserExists, createUser } from '@/repositories/UserRepository';
import { upsertProfile } from '@/repositories/ProfileRepository';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, freefire_id } = await request.json();

    if (!name || !email || !password || !freefire_id) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const normalizedEmail = (email as string).toLowerCase().trim();
    const normalizedId = (freefire_id as string).trim();

    const { emailExists, idExists } = await checkUserExists(normalizedEmail, normalizedId);

    if (emailExists) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }
    if (idExists) {
      return NextResponse.json({ error: 'Este ID do Free Fire já está em uso.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      name: (name as string).trim(),
      email: normalizedEmail,
      freefire_id: normalizedId,
      passwordHash,
    });

    await upsertProfile(String(newUser._id), {
      game_id: normalizedId,
      nickname: (name as string).trim(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
