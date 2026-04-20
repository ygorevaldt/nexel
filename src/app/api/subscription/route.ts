import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserById } from "@/repositories/UserRepository";
import { findTransactionsByUser } from "@/repositories/TransactionRepository";

/**
 * GET /api/subscription
 * Returns the current user's subscription status, Stripe IDs (masked),
 * and their subscription payment history.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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
      /** Plans with their Stripe Price IDs — ready for checkout session creation */
      availablePlans: [
        {
          id: "PRO",
          name: "Jogador Pro",
          description: "Análises de IA ilimitadas + histórico completo de evolução",
          priceMonthly: 2990, // R$ 29,90 in cents
          stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
          features: [
            "Análises de gameplay ilimitadas",
            "Histórico de evolução (AI Score)",
            "Feedback de Performance",
            "Perfil destacado no ranking",
          ],
        },
        {
          id: "SCOUT",
          name: "Scout / Time",
          description: "Acesso a dados de contato + filtros avançados de busca de talentos",
          priceMonthly: 9990, // R$ 99,90 in cents
          stripePriceId: process.env.STRIPE_PRICE_SCOUT ?? null,
          features: [
            "Tudo do Plano Pro",
            "Acesso a dados de contato dos jogadores",
            "Filtros avançados de busca de talentos",
            "Exportar relatórios de jogadores",
            "Badge verificado no perfil",
          ],
        },
      ],
      transactions: txData,
    });
  } catch (error) {
    console.error("[GET /api/subscription]", error);
    return NextResponse.json({ error: "Falha ao buscar assinatura" }, { status: 500 });
  }
}
