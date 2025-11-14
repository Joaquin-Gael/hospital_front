import { Turn } from './appointment.interfaces';
import { UserRead } from './user.interfaces';

export interface TurnDocumentSummary extends TurnDocumentDownloadLog {
  id: string;
  turn_id: string;
  userId: string;
  filePath: string;
  generated_at: string;
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
