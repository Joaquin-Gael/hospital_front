import { Turn } from './appointment.interfaces';
import { UserRead } from './user.interfaces';

export interface TurnDocumentSummary {
  id: string;
  turnId: string;
  userId: string;
  filePath: string;
  generatedAt: string;
  filename: string;
  turn?: Turn | null;
}

export interface TurnDocumentDownloadLog {
  id: string;
  turnDocumentId: string;
  turnId: string;
  userId: string;
  downloadedAt: string;
  channel: string;
  clientIp?: string | null;
  userAgent?: string | null;
  user?: UserRead | null;
  turn?: Turn | null;
}
