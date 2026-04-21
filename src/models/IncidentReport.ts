import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncidentReport extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

const IncidentReportSchema: Schema<IIncidentReport> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
  },
  { timestamps: true }
);

IncidentReportSchema.index({ status: 1, createdAt: -1 });

export const IncidentReport: Model<IIncidentReport> =
  (mongoose.models.IncidentReport as Model<IIncidentReport>) ??
  mongoose.model<IIncidentReport>('IncidentReport', IncidentReportSchema);
