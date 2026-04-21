import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserById } from "@/repositories/UserRepository";
import { findAllActivePlans } from "@/repositories/PlanRepository";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [user, plans] = await Promise.all([findUserById(session.user.id), findAllActivePlans()]);

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const availablePlans = plans.map((p) => ({
      id: p.planId,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthlyCents,
      features: p.features,
    }));

    return NextResponse.json({
      data: {
        subscriptionStatus: user.subscriptionStatus,
        welcome_analysis_credits: user.welcome_analysis_credits ?? 0,
        welcome_booyah_credits: user.welcome_booyah_credits ?? 0,
        availablePlans,
      },
    });
  } catch (error) {
    console.error("[GET /api/me/credits]", error);
    return NextResponse.json({ error: "Falha interna" }, { status: 500 });
  }
}
