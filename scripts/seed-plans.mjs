import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

const PlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    priceMonthlyCents: { type: Number, required: true },
    stripePriceId: { type: String, default: null },
    features: { type: [String], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);

const INITIAL_PLANS = [
  {
    planId: "PRO",
    name: "Jogador Pro",
    description: "Análises de IA ilimitadas + histórico completo de evolução",
    priceMonthlyCents: 990, // R$ 9,90
    stripePriceId: "price_altere_isso_no_banco_pro",
    features: [
      "Análises de gameplay ilimitadas",
      "Histórico de evolução (AI Score)",
      "Feedback de Performance",
      "Perfil destacado no ranking",
    ],
    isActive: true,
  },
  {
    planId: "SCOUT",
    name: "Scout / Time",
    description: "Acesso a dados de contato + filtros avançados de busca de talentos",
    priceMonthlyCents: 2990, // R$ 29,90
    stripePriceId: "price_altere_isso_no_banco_scout",
    features: [
      "Tudo do Plano Pro",
      "Acesso a dados de contato dos jogadores",
      "Filtros avançados de busca de talentos",
      "Exportar relatórios de jogadores",
      "Badge verificado no perfil",
    ],
    isActive: true,
  },
];

async function seedPlans() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB. Iniciando seed de planos...");

    for (const planData of INITIAL_PLANS) {
      // Usamos setOnInsert apenas para o stripePriceId para não sobrescrever um ID real configurado caso rode mais de uma vez.
      const plan = await Plan.findOneAndUpdate(
        { planId: planData.planId },
        {
          $setOnInsert: {
            stripePriceId: planData.stripePriceId,
          },
          $set: {
            name: planData.name,
            description: planData.description,
            priceMonthlyCents: planData.priceMonthlyCents,
            features: planData.features,
            isActive: planData.isActive,
          },
        },
        { upsert: true, new: true }
      );
      
      console.log(`Plano ${plan.planId} atualizado com sucesso! Preço: R$ ${(plan.priceMonthlyCents / 100).toFixed(2).replace('.', ',')}`);
    }

    console.log("Seed de planos concluído.");
    process.exit(0);
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  }
}

seedPlans();
