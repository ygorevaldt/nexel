import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { findProfileByUserId, findProfileById } from "@/repositories/ProfileRepository";
import { findUserById } from "@/repositories/UserRepository";
import { findPlayRequest, createPlayRequest } from "@/repositories/PlayRequestRepository";
import { createNotification } from "@/repositories/NotificationRepository";

const PostBodySchema = z.object({
  to_profile_id: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const toProfileId = searchParams.get("to_profile_id");
    if (!toProfileId) {
      return NextResponse.json({ error: "to_profile_id é obrigatório" }, { status: 400 });
    }

    const existing = await findPlayRequest(session.user.id, toProfileId);
    return NextResponse.json({
      data: {
        exists: existing !== null,
        status: existing?.status ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/play-request]", error);
    return NextResponse.json({ error: "Falha interna" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = PostBodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { to_profile_id } = body.data;

    const targetProfile = await findProfileById(to_profile_id);
    if (!targetProfile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    // Prevent sending request to own profile
    if (targetProfile.user_id.toString() === session.user.id) {
      return NextResponse.json({ error: "Você não pode enviar interesse para si mesmo" }, { status: 400 });
    }

    // Check for existing request
    const existing = await findPlayRequest(session.user.id, to_profile_id);
    if (existing) {
      return NextResponse.json(
        { error: "Você já enviou interesse para este jogador", status: existing.status },
        { status: 409 },
      );
    }

    const playRequest = await createPlayRequest({
      from_user_id: session.user.id,
      to_profile_id,
    });

    // Notify the target player
    const fromUser = await findUserById(session.user.id);
    const fromProfile = await findProfileByUserId(session.user.id);
    const fromNickname = fromProfile?.nickname ?? fromUser?.name ?? "Um jogador";

    await createNotification({
      user_id: targetProfile.user_id.toString(),
      type: "PLAY_REQUEST_RECEIVED",
      message: `${fromNickname} quer jogar junto com você!`,
      metadata: {
        nickname: fromNickname,
        game_id: fromProfile?.game_id ?? fromUser?.freefire_id,
        play_request_id: String(playRequest._id),
      },
    });

    return NextResponse.json({ data: { id: String(playRequest._id), status: "PENDING" } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/play-request]", error);
    return NextResponse.json({ error: "Falha interna" }, { status: 500 });
  }
}
