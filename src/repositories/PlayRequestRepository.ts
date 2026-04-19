import dbConnect from '@/lib/db';
import { PlayRequest, IPlayRequest } from '@/models/PlayRequest';

export async function findPlayRequest(
  fromUserId: string,
  toProfileId: string
): Promise<IPlayRequest | null> {
  await dbConnect();
  return PlayRequest.findOne({ from_user_id: fromUserId, to_profile_id: toProfileId }).lean();
}

export async function findPlayRequestById(id: string): Promise<IPlayRequest | null> {
  await dbConnect();
  return PlayRequest.findById(id).lean();
}

export async function createPlayRequest(data: {
  from_user_id: string;
  to_profile_id: string;
}): Promise<IPlayRequest> {
  await dbConnect();
  return PlayRequest.create({ ...data, status: 'PENDING' });
}

export async function respondToPlayRequest(
  id: string,
  data: { response_type: 'whatsapp' | 'discord'; response_contact: string }
): Promise<IPlayRequest | null> {
  await dbConnect();
  return PlayRequest.findByIdAndUpdate(
    id,
    { $set: { status: 'RESPONDED', ...data } },
    { new: true }
  ).lean();
}
