import dbConnect from '@/lib/db';
import { IncidentReport, IIncidentReport } from '@/models/IncidentReport';

const INCIDENTS_PAGE_LIMIT = 20;

export interface IncidentUser {
  _id: string;
  email: string;
  name: string;
}

export interface PopulatedIncidentReport {
  _id: { toString(): string };
  userId: IncidentUser;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

export async function createIncidentReport(data: {
  userId: string;
  description: string;
}): Promise<IIncidentReport> {
  await dbConnect();
  return IncidentReport.create({ ...data, status: 'OPEN' });
}

export async function findIncidentReportsPaginated(
  page: number
): Promise<{ reports: PopulatedIncidentReport[]; total: number }> {
  await dbConnect();
  const skip = (page - 1) * INCIDENTS_PAGE_LIMIT;
  const [rawReports, total] = await Promise.all([
    IncidentReport.find()
      .populate<{ userId: IncidentUser }>('userId', 'email name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(INCIDENTS_PAGE_LIMIT)
      .lean(),
    IncidentReport.countDocuments(),
  ]);
  const reports = rawReports as unknown as PopulatedIncidentReport[];
  return { reports, total };
}

export async function findIncidentReportsByUserId(
  userId: string,
  page = 1,
  limit = 25
): Promise<{ reports: IIncidentReport[]; hasMore: boolean }> {
  await dbConnect();
  const skip = (page - 1) * limit;
  const raw = await IncidentReport.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();
  const hasMore = raw.length > limit;
  return { reports: hasMore ? raw.slice(0, limit) : raw, hasMore };
}

export async function findIncidentReportById(id: string): Promise<IIncidentReport | null> {
  await dbConnect();
  return IncidentReport.findById(id).lean();
}

export async function resolveIncidentReport(id: string): Promise<IIncidentReport | null> {
  await dbConnect();
  return IncidentReport.findByIdAndUpdate(
    id,
    { $set: { status: 'RESOLVED' } },
    { new: true }
  ).lean();
}
