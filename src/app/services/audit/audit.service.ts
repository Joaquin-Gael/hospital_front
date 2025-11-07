import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { AUDIT_ENDPOINTS } from './audit-endpoints';
import {
  AuditEventRead,
  AuditMetadataDictionary,
  AuditMetadataEntry,
  AuditMetadataMap,
  AuditQueryParams,
} from '../interfaces/audit.interfaces';

export type AuditExportFormat = 'csv' | 'xlsx' | 'json' | string;

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  list(params: AuditQueryParams = {}): Observable<AuditEventRead[]> {
    const httpParams = this.buildHttpParams(params);

    return this.api.get<AuditEventRead[]>(AUDIT_ENDPOINTS.list(), { params: httpParams }).pipe(
      map((events) => events ?? []),
      catchError((error) => this.handleError(error, 'Failed to load audit events'))
    );
  }

  export(params: AuditQueryParams = {}, format: AuditExportFormat = 'csv'): Observable<Blob> {
    const httpParams = this.buildHttpParams(params).set('format', format);

    const options: any = {
      params: httpParams,
      responseType: 'blob' as const,
    };

    return this.api.get<Blob>(AUDIT_ENDPOINTS.export(), options).pipe(
      catchError((error) => {
        if (error?.status === 503) {
          const message = 'Audit trail is disabled by configuration.';
          this.logger.warn(message, error);
          return throwError(() => new Error(message));
        }

        return this.handleError(error, 'Failed to export audit events');
      })
    );
  }

  translateDetailMetadata(
    metadata?: AuditMetadataMap | null,
    dictionary?: AuditMetadataDictionary
  ): AuditMetadataEntry[] {
    return this.translateMetadata(metadata, dictionary);
  }

  translateRequestMetadata(
    metadata?: AuditMetadataMap | null,
    dictionary?: AuditMetadataDictionary
  ): AuditMetadataEntry[] {
    return this.translateMetadata(metadata, dictionary);
  }

  translateMetadata(
    metadata?: AuditMetadataMap | null,
    dictionary?: AuditMetadataDictionary
  ): AuditMetadataEntry[] {
    if (!metadata) {
      return [];
    }

    return Object.entries(metadata)
      .map(([key, value]) => ({
        key,
        label: dictionary?.[key] ?? this.formatLabel(key),
        value: this.formatValue(value),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private buildHttpParams(params: AuditQueryParams): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return;
        }
        httpParams = httpParams.set(key, value.join(','));
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }

  private handleError(error: any, context: string): Observable<never> {
    const message = this.resolveErrorMessage(error);
    this.logger.error(`${context}: ${message}`, error);
    return throwError(() => new Error(message));
  }

  private resolveErrorMessage(error: any): string {
    if (!error || typeof error.status !== 'number') {
      return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
    }

    switch (error.status) {
      case 400:
        return 'Solicitud inválida. Verifica los datos enviados.';
      case 401:
        return 'No autorizado. Sesión expirada.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 500:
        return 'Error interno del servidor. Contacta al soporte.';
      default:
        return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
    }
  }

  private formatValue(value: AuditMetadataMap[keyof AuditMetadataMap]): string {
    if (Array.isArray(value)) {
      return value.map((item) => this.stringifyValue(item)).join(', ');
    }

    return this.stringifyValue(value);
  }

  private stringifyValue(value: AuditMetadataMap[keyof AuditMetadataMap] | AuditMetadataMap[keyof AuditMetadataMap][]): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    return String(value);
  }

  private formatLabel(key: string): string {
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }
}
