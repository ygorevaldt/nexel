import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findProfileByUserId } from '@/repositories/ProfileRepository';
import { findPlayRequestById, respondToPlayRequest } from '@/repositories/PlayRequestRepository';
import { createNotification } from '@/repositories/NotificationRepository';

const RespondBodySchema = z.object({
  response_type: z.enum(['whatsapp', 'discord']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = RespondBodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { response_type } = body.data;

    const playRequest = await findPlayRequestById(id);
    if (!playRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (playRequest.status === 'RESPONDED') {
      return NextResponse.json({ error: 'Solicitação já foi respondida' }, { status: 409 });
    }

    // Verify the caller owns the target profile
    const responderProfile = await findProfileByUserId(session.user.id);
    if (!responderProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    if (String(responderProfile._id) !== playRequest.to_profile_id.toString()) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Check if the selected contact type is available
    const contactValue =
      response_type === 'whatsapp'
        ? responderProfile.contact_info?.whatsapp
        : responderProfile.contact_info?.discord;

    if (!contactValue) {
      return NextResponse.json(
        {
          error: `Você não tem ${response_type === 'whatsapp' ? 'WhatsApp' : 'Discord'} cadastrado. Acesse Configurações para adicionar.`,
        },
        { status: 400 }
      );
    }

    await respondToPlayRequest(id, {
      response_type,
      response_contact: contactValue,
    });

    // Notify the requester
    const responseTypeLabel = response_type === 'whatsapp' ? 'WhatsApp' : 'Discord';
    await createNotification({
      user_id: playRequest.from_user_id.toString(),
      type: 'PLAY_REQUEST_RESPONDED',
      message: `Boa notícia! ${responderProfile.nickname} aceitou jogar junto com você. Entre em contato: ${responseTypeLabel}: ${contactValue}`,
      metadata: {
        nickname: responderProfile.nickname,
        game_id: responderProfile.game_id,
        contact: contactValue,
        response_type,
        play_request_id: id,
      },
    });

    return NextResponse.json({ data: { status: 'RESPONDED' } });
  } catch (error) {
    console.error('[POST /api/play-request/[id]/respond]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
