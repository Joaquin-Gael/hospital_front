import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { TurnDocumentDownloadLog, TurnDocumentSummary } from '../interfaces/turn-documents.interfaces';
import { TURN_DOCUMENTS_ENDPOINTS } from './turn-documents.endpoints';

@Injectable({
  providedIn: 'root',
})
export class TurnDocumentsService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: LoggerService,
  ) {}

  downloadMyTurnPdf(turnId: string, channel = 'web'): Observable<Blob> {
    const options = {
      headers: new HttpHeaders({ 'x-download-channel': channel }),
      responseType: 'blob' as const,
    };

    this.logger.debug('Downloading turn PDF', { turnId, channel });

    return this.apiService
      .get<Blob>(TURN_DOCUMENTS_ENDPOINTS.downloadTurnPdf(turnId), options)
      .pipe(
        catchError((error) => {
          this.logger.error('Failed to download turn PDF', { turnId, error });
          return throwError(() => error);
        }),
      );
  }

  downloadTurnPdfAsAdmin(userId: string, turnId: string, channel = 'web-admin'): Observable<Blob> {
    const options = {
      headers: new HttpHeaders({ 'x-download-channel': channel }),
      responseType: 'blob' as const,
    };

    this.logger.debug('Downloading turn PDF as admin', { userId, turnId, channel });

    return this.apiService
      .get<Blob>(TURN_DOCUMENTS_ENDPOINTS.downloadTurnPdfAsAdmin(userId, turnId), options)
      .pipe(
        catchError((error) => {
          this.logger.error('Failed to download turn PDF as admin', { userId, turnId, error });
          return throwError(() => error);
        }),
      );
  }

  listMyTurnDocuments(): Observable<TurnDocumentSummary[]> {
    this.logger.debug('Loading generated turn documents');

    return this.apiService.get<TurnDocumentSummary[]>(TURN_DOCUMENTS_ENDPOINTS.listMyTurnDocuments).pipe(
      map((documents) => documents ?? []),
      catchError((error) => {
        this.logger.error('Failed to load generated turn documents', error);
        return throwError(() => error);
      }),
    );
  }

  listMyTurnDocumentDownloads(): Observable<TurnDocumentDownloadLog[]> {
    this.logger.debug('Loading turn document download history');

    return this.apiService
      .get<TurnDocumentDownloadLog[]>(TURN_DOCUMENTS_ENDPOINTS.listMyTurnDocumentDownloads)
      .pipe(
        map((downloads) => downloads ?? []),
        catchError((error) => {
          this.logger.error('Failed to load turn document download history', error);
          return throwError(() => error);
        }),
      );
  }
}
