import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlan extends Document {
  planId: "PRO" | "SCOUT";
  name: string;
  description: string;
  priceMonthlyCents: number;
  stripePriceId: string | null;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema<IPlan> = new Schema(
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


export const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);
