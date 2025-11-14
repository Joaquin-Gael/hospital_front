import { Turn } from './appointment.interfaces';
import { UserRead } from './user.interfaces';

export interface TurnDocumentSummary {
  id: string;
  turn_id: string;
  userId: string;
  filePath: string;
  generatedAt: string;
  filename: string;
  turn?: Turn | null;
}

export interface TurnDocumentDownloadLog {
  id: string;
  turnDocumentId: string;
  turn_id: string;
  userId: string;
  downloaded_at: string;
  channel: string;
  client_ip?: string | null;
  user_agent?: string | null;
  user?: UserRead | null;
  turn?: Turn | null;
}
