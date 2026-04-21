import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserById } from "@/repositories/UserRepository";
import { findTransactionsByUser } from "@/repositories/TransactionRepository";
import { findAllActivePlans } from "@/repositories/PlanRepository";

/**
 * GET /api/subscription
 * Returns the current user's subscription status, Stripe IDs (masked),
 * and their subscription payment history.
 */
export async function GET() {
  try {
    const session = await auth();

    // Semi-public route: Fetch active plans
    const plans = await findAllActivePlans();
    const availablePlans = plans.map((p) => ({
      id: p.planId,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthlyCents,
      stripePriceId: p.stripePriceId,
      features: p.features,
    }));

    if (!session?.user?.id) {
      return NextResponse.json({
        subscriptionStatus: "FREE",
        accountType: "PLAYER",
        availablePlans,
        transactions: [],
      });
    }

    const [user, transactions] = await Promise.all([
      findUserById(session.user.id),
      findTransactionsByUser(session.user.id, 20),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const txData = transactions.map((t) => ({
      id: String(t._id),
      date: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(t.createdAt)),
      type: t.type,
      plan: t.plan,
      // Amount is stored in cents, display in BRL
      amount: t.amount / 100,
      status: t.status,
    }));

    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus,
      accountType: user.accountType,
      subscriptionEndDate: user.subscriptionEndDate ?? null,
      availablePlans,
      transactions: txData,
    });
  } catch (error) {
    console.error("[GET /api/subscription]", error);
    return NextResponse.json({ error: "Falha ao buscar assinatura" }, { status: 500 });
  }
}
