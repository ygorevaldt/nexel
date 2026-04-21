import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createIncidentReport, findIncidentReportsByUserId } from '@/repositories/IncidentReportRepository';

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 2000;
const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1));
    const { reports, hasMore } = await findIncidentReportsByUserId(session.user.id, page, PAGE_SIZE);

    const data = reports.map((r) => ({
      id: r._id.toString(),
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ data, hasMore });
  } catch (error) {
    console.error('[GET /api/support]', error);
    return NextResponse.json({ error: 'Falha ao buscar chamados' }, { status: 500 });
  }
}

const CreateIncidentSchema = z.object({
  description: z
    .string()
    .min(MIN_DESCRIPTION_LENGTH, `Descreva o problema com pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres.`)
    .max(MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = CreateIncidentSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const report = await createIncidentReport({
      userId: session.user.id,
      description: body.data.description,
    });

    return NextResponse.json({ data: { id: report._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/support]', error);
    return NextResponse.json({ error: 'Falha ao abrir chamado' }, { status: 500 });
  }
}
