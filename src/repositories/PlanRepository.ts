import dbConnect from "@/lib/db";
import { Plan, IPlan } from "@/models/Plan";

export async function findAllActivePlans(): Promise<IPlan[]> {
  await dbConnect();
  // Get active plans and sort them (e.g. PRO first, SCOUT second based on price)
  return Plan.find({ isActive: true }).sort({ priceMonthlyCents: 1 }).lean();
}

export async function findPlanById(planId: string): Promise<IPlan | null> {
  await dbConnect();
  return Plan.findOne({ planId }).lean();
}
