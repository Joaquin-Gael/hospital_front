export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  DOWNLOAD = 'download',
}

export enum AuditTargetType {
  USER = 'user',
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  APPOINTMENT = 'appointment',
  SERVICE = 'service',
  SCHEDULE = 'schedule',
  AUTH = 'auth',
  SYSTEM = 'system',
  OTHER = 'other',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export type AuditMetadataValue = string | number | boolean | string[] | null | undefined;

export type AuditMetadataMap = Record<string, AuditMetadataValue>;

export interface AuditMetadataDictionary {
  [key: string]: string;
}

export interface AuditMetadataEntry {
  key: string;
  label: string;
  value: string;
}

export interface AuditMetadataSchemas {
  detail?: AuditMetadataDictionary;
  request?: AuditMetadataDictionary;
}

export interface AuditEventRead {
  id: string;
  created_at: string;
  action: AuditAction;
  actor_id?: string;
  actor_display?: string;
  target_id?: string;
  target_type: AuditTargetType;
  target_display?: string;
  severity: AuditSeverity;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  request_metadata?: AuditMetadataMap | null;
  detail_metadata?: AuditMetadataMap | null;
  metadata_schemas?: AuditMetadataSchemas;
}

export interface AuditQueryParams {
  limit?: number;
  offset?: number;
  ordering?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  actions?: AuditAction[];
  severities?: AuditSeverity[];
  target_types?: AuditTargetType[];
  actor_id?: string;
  target_id?: string;
}
