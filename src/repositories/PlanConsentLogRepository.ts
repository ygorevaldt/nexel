import dbConnect from '@/lib/db';
import { PlanConsentLog, IPlanConsentLog, PlanConsentAction, PlanTier } from '@/models/PlanConsentLog';

export async function createPlanConsentLog(data: {
  user_id: string;
  action: PlanConsentAction;
  from_plan: PlanTier;
  to_plan: PlanTier;
  ip_address?: string;
  user_agent?: string;
}): Promise<IPlanConsentLog> {
  await dbConnect();
  return PlanConsentLog.create(data);
}

export async function findConsentLogsByUserId(userId: string): Promise<IPlanConsentLog[]> {
  await dbConnect();
  return PlanConsentLog.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
}
