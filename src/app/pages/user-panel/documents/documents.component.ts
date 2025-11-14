import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { NotificationService } from '../../../core/notification';
import { LoggerService } from '../../../services/core/logger.service';
import { TurnDocumentsService } from '../../../services/turn-documents/turn-documents.service';
import {
  TurnDocumentDownloadLog,
  TurnDocumentSummary,
} from '../../../services/interfaces/turn-documents.interfaces';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { downloadBlob } from '../../../shared/utils/download.utils';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
})
export class DocumentsComponent implements OnInit, OnDestroy {
  private readonly turnDocumentsService = inject(TurnDocumentsService);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  documents: TurnDocumentSummary[] = [];
  downloadLogs: TurnDocumentDownloadLog[] = [];

  loadingDocuments = false;
  loadingDownloads = false;

  documentsError: string | null = null;
  downloadLogsError: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly downloadingTurnIds = new Set<string>();
  private readonly documentsById = new Map<string, TurnDocumentSummary>();

  ngOnInit(): void {
    this.loadDocuments();
    this.loadDownloadLogs();
  }

  private loadDocuments(): void {
    this.loadingDocuments = true;
    this.documentsError = null;

    this.turnDocumentsService
      .listMyTurnDocuments()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loadingDocuments = false))
      )
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          this.documentsById.clear();
          documents.forEach((document) => this.documentsById.set(document.id, document));
          this.logger.debug('Turn documents loaded', { count: documents.length });
        },
        error: (err) => {
          this.documentsError = 'No se pudieron cargar los comprobantes generados.';
          this.logger.error('Failed to load turn documents', err);
        },
      });
  }

  private loadDownloadLogs(): void {
    this.loadingDownloads = true;
    this.downloadLogsError = null;

    this.turnDocumentsService
      .listMyTurnDocumentDownloads()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loadingDownloads = false))
      )
      .subscribe({
        next: (downloads) => {
          this.downloadLogs = downloads;
          this.logger.debug('Turn document downloads loaded', { count: downloads.length });
        },
        error: (err) => {
          this.downloadLogsError = 'No se pudo obtener el historial de descargas.';
          this.logger.error('Failed to load turn document download history', err);
        },
      });
  }

  onRefresh(): void {
    this.loadDocuments();
    this.loadDownloadLogs();
  }

  onDownloadDocument(document: TurnDocumentSummary): void {
    if (!document.turn_id) {
      this.notificationService.error('No se encontró el identificador del turno.');
      this.logger.error('Missing turnId in document summary', document);
      return;
    }

    this.downloadTurnDocument(document.turn_id, document.filename);
  }

  onDownloadFromLog(log: TurnDocumentDownloadLog): void {
    if (!log.turn_id) {
      this.notificationService.error('No se encontró el identificador del turno.');
      this.logger.error('Missing turnId in download log', log);
      return;
    }

    const filename = this.resolveFilenameFromLog(log);
    this.downloadTurnDocument(log.turn_id, filename);
  }

  private downloadTurnDocument(turnId: string, filename: string | null | undefined): void {
    if (this.downloadingTurnIds.has(turnId)) {
      return;
    }

    this.downloadingTurnIds.add(turnId);
    this.notificationService.info('Generando comprobante...');

    this.turnDocumentsService
      .downloadMyTurnPdf(turnId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.downloadingTurnIds.delete(turnId))
      )
      .subscribe({
        next: (blob) => {
          const safeFilename = filename?.trim() ? filename.trim() : this.buildFallbackFilename(turnId);
          downloadBlob(blob, safeFilename);
          this.notificationService.success('Comprobante descargado correctamente');
        },
        error: (err) => {
          this.notificationService.error('No se pudo descargar el comprobante. Intenta nuevamente.');
          this.logger.error('Error downloading turn document', { turnId, err });
        },
      });
  }

  isDownloading(turnId: string | null | undefined): boolean {
    return !!turnId && this.downloadingTurnIds.has(turnId);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return 'Sin fecha';
    }

    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return 'Sin registro';
    }

    const date = new Date(dateStr);
    return `${date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })} · ${date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  formatChannel(channel: string | null | undefined): string {
    if (!channel) {
      return '—';
    }

    return channel.replace(/[_-]/g, ' ').toUpperCase();
  }

  getDocumentSubtitle(document: TurnDocumentSummary): string {
    const specialty = document.turn?.service?.[0]?.name ?? null;
    const date = document.turn?.date ?? null;

    if (specialty && date) {
      return `${specialty} · ${this.formatDate(date)}`;
    }

    if (specialty) {
      return specialty;
    }

    if (date) {
      return this.formatDate(date);
    }

    return 'Sin información del turno';
  }

  getLogSubtitle(log: TurnDocumentDownloadLog): string {
    const document = this.documentsById.get(log.turnDocumentId);
    const fallbackTurn = document?.turn ?? null;
    const specialty = log.turn?.service?.[0]?.name ?? fallbackTurn?.service?.[0]?.name ?? null;
    const date = log.turn?.date ?? fallbackTurn?.date ?? null;

    if (specialty && date) {
      return `${specialty} · ${this.formatDate(date)}`;
    }

    if (specialty) {
      return specialty;
    }

    if (date) {
      return this.formatDate(date);
    }

    return 'Sin información del turno';
  }

  getFilenameForLog(log: TurnDocumentDownloadLog): string {
    const filename = this.resolveFilenameFromLog(log);
    if (filename?.trim()) {
      return filename.trim();
    }

    return this.buildFallbackFilename(log.turn_id);
  }

  trackByDocumentId(index: number, document: TurnDocumentSummary): string {
    return document.id;
  }

  trackByDownloadId(index: number, download: TurnDocumentDownloadLog): string {
    return download.id;
  }

  private resolveFilenameFromLog(log: TurnDocumentDownloadLog): string | undefined {
    const document = this.documentsById.get(log.turnDocumentId);
    if (document?.filename) {
      return document.filename;
    }

    const fallbackTurn = document?.turn ?? null;
    const serviceName =
      log.turn?.service?.[0]?.name ??
      fallbackTurn?.service?.[0]?.name ??
      null;
    const date = log.turn?.date ?? fallbackTurn?.date ?? null;

    return this.buildFilenameFromContext(serviceName, date);
  }

  private buildFallbackFilename(turnId: string): string {
    return `turno-${turnId}.pdf`;
  }

  private buildFilenameFromContext(specialty: string | null | undefined, dateStr: string | null | undefined): string {
    const normalizedSpecialty = this.normalizeForFilename(specialty ?? 'hospital');
    const datePart = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `turno-${normalizedSpecialty}-${datePart}.pdf`;
  }

  private normalizeForFilename(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'hospital';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.downloadingTurnIds.clear();
    this.documentsById.clear();
  }
}
