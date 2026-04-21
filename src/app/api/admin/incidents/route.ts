import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findIncidentReportsPaginated } from '@/repositories/IncidentReportRepository';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (session.user.systemRole !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

    const { reports, total } = await findIncidentReportsPaginated(page);

    return NextResponse.json({ data: { reports, total, page } });
  } catch (error) {
    console.error('[GET /api/admin/incidents]', error);
    return NextResponse.json({ error: 'Falha ao buscar incidentes' }, { status: 500 });
  }
}
