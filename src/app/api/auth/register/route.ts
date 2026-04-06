import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, freefire_id } = await request.json();

    if (!name || !email || !password || !freefire_id) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    await dbConnect();

    const [emailExists, idExists] = await Promise.all([
      User.findOne({ email: email.toLowerCase().trim() }),
      User.findOne({ freefire_id: freefire_id.trim() }),
    ]);

    if (emailExists) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }

    if (idExists) {
      return NextResponse.json({ error: 'Este ID do Free Fire já está em uso.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      freefire_id: freefire_id.trim(),
      passwordHash,
      role: 'FREE',
      wallet_balance: 0,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
