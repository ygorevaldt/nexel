import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findIncidentReportById, resolveIncidentReport } from '@/repositories/IncidentReportRepository';
import { createNotification } from '@/repositories/NotificationRepository';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (session.user.systemRole !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await findIncidentReportById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Incidente não encontrado' }, { status: 404 });
    }
    if (existing.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Incidente já está resolvido' }, { status: 409 });
    }

    const resolved = await resolveIncidentReport(id);

    await createNotification({
      user_id: existing.userId.toString(),
      type: 'SUPPORT_TICKET_RESOLVED',
      message: `Seu chamado de suporte foi resolvido pela equipe Nexel. Obrigado pelo relato!`,
      metadata: { play_request_id: id },
    });

    return NextResponse.json({ data: { id: resolved?._id.toString(), status: resolved?.status } });
  } catch (error) {
    console.error('[PATCH /api/admin/incidents/[id]/resolve]', error);
    return NextResponse.json({ error: 'Falha ao resolver incidente' }, { status: 500 });
  }
}
