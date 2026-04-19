import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { updateProfileSettings } from '@/repositories/ProfileRepository';
import { updateUserName } from '@/repositories/UserRepository';

const WHATSAPP_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;
const DISCORD_REGEX = /^[a-zA-Z0-9._]{2,32}(#\d{4})?$/;

const UpdateProfileSchema = z.object({
  nickname: z.string().min(2).max(50).optional(),
  contact_info: z
    .object({
      discord: z
        .string()
        .max(32)
        .refine((v) => !v || DISCORD_REGEX.test(v), 'Formato de Discord inválido')
        .optional(),
      whatsapp: z
        .string()
        .max(15)
        .refine((v) => !v || WHATSAPP_REGEX.test(v), 'Formato de WhatsApp inválido')
        .optional(),
      email: z.string().email().max(100).optional().or(z.literal('')),
      instagram: z.string().max(60).optional(),
    })
    .optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = UpdateProfileSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { nickname, contact_info } = body.data;

    const updateData: Parameters<typeof updateProfileSettings>[1] = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (contact_info !== undefined) updateData.contact_info = contact_info;

    const updatedProfile = await updateProfileSettings(session.user.id, updateData);
    if (!updatedProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Keep User.name in sync with profile nickname
    if (nickname !== undefined) {
      await updateUserName(session.user.id, nickname);
    }

    return NextResponse.json({ data: updatedProfile });
  } catch (error) {
    console.error('[PUT /api/me/profile]', error);
    return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 });
  }
}
