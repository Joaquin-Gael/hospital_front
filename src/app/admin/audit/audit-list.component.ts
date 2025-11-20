import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { AuditService, AuditExportFormat } from '../../services/audit/audit.service';
import {
  AuditAction,
  AuditEventRead,
  AuditQueryParams,
  AuditSeverity,
  AuditTargetType,
} from '../../services/interfaces/audit.interfaces';
import { LoggerService } from '../../services/core/logger.service';

interface AuditViewItem extends AuditEventRead {
  createdAtFormatted: string;
  actionLabel: string;
  severityLabel: string;
  requestMetadataText: string;
  detailMetadataText: string;
}

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    DataTableComponent,
    ViewDialogComponent,
  ],
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly fb = inject(FormBuilder);
  private readonly logger = inject(LoggerService);

  auditEvents: AuditEventRead[] = [];
  loading = false;
  exportLoading = false;
  error: string | null = null;
  filterForm: FormGroup;
  viewDialogOpen = false;
  selectedViewItem: AuditViewItem | null = null;
  currentParams: AuditQueryParams = {};

  readonly actions = Object.values(AuditAction);
  readonly severities = Object.values(AuditSeverity);
  readonly targetTypes = Object.values(AuditTargetType);

  readonly tableColumns: TableColumn[] = [
    { key: 'created_at', label: 'Fecha y hora', format: (value) => this.formatDate(value) },
    { key: 'action', label: 'Acción', format: (value) => this.formatAction(value as AuditAction) },
    { key: 'severity', label: 'Severidad', format: (value) => this.formatSeverity(value as AuditSeverity) },
    { key: 'actor_display', label: 'Actor' },
    { key: 'target_display', label: 'Objetivo' },
    { key: 'ip_address', label: 'IP' },
  ];

  readonly viewDialogColumns: ViewDialogColumn[] = [
    { key: 'createdAtFormatted', label: 'Fecha y hora' },
    { key: 'actionLabel', label: 'Acción' },
    { key: 'severityLabel', label: 'Severidad' },
    { key: 'actor_display', label: 'Actor' },
    { key: 'target_display', label: 'Objetivo' },
    { key: 'target_type', label: 'Tipo de objetivo', format: (value) => this.formatTargetType(value as AuditTargetType) },
    { key: 'description', label: 'Descripción' },
    { key: 'ip_address', label: 'IP' },
    { key: 'user_agent', label: 'User agent' },
    { key: 'requestMetadataText', label: 'Datos de solicitud' },
    { key: 'detailMetadataText', label: 'Datos de detalle' },
  ];

  readonly headerActions: ActionButton[] = [
    {
      label: 'Actualizar',
      icon: 'refresh',
      variant: 'secondary',
      ariaLabel: 'Refrescar eventos de auditoría',
      onClick: () => this.loadAuditEvents(),
    },
    {
      label: 'Exportar CSV',
      icon: 'download',
      variant: 'primary',
      ariaLabel: 'Exportar auditoría en CSV',
      onClick: () => this.exportAudit('csv'),
    },
    {
      label: 'Exportar XLSX',
      icon: 'download',
      variant: 'primary',
      ariaLabel: 'Exportar auditoría en XLSX',
      onClick: () => this.exportAudit('xlsx'),
    },
    {
      label: 'Exportar JSON',
      icon: 'download',
      variant: 'secondary',
      ariaLabel: 'Exportar auditoría en JSON',
      onClick: () => this.exportAudit('json'),
    },
  ];

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      from_date: [''],
      to_date: [''],
      actions: [[]],
      severities: [[]],
      target_types: [[]],
      actor_id: [''],
      target_id: [''],
      ordering: ['-created_at'],
      limit: [50],
      offset: [0],
    });
  }

  ngOnInit(): void {
    this.loadAuditEvents();
  }

  loadAuditEvents(): void {
    this.loading = true;
    this.error = null;
    this.currentParams = this.buildQueryParams();

    this.auditService
      .list(this.currentParams)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (events) => {
          this.auditEvents = events;
        },
        error: (err) => {
          this.error = err?.message || 'No se pudieron cargar los eventos de auditoría.';
          this.logger.error('Failed to load audit events', err);
        },
      });
  }

  onApplyFilters(): void {
    this.loadAuditEvents();
  }

  onClearFilters(): void {
    this.filterForm.reset({
      search: '',
      from_date: '',
      to_date: '',
      actions: [],
      severities: [],
      target_types: [],
      actor_id: '',
      target_id: '',
      ordering: '-created_at',
      limit: 50,
      offset: 0,
    });

    this.loadAuditEvents();
  }

  onView(event: AuditEventRead): void {
    this.selectedViewItem = this.toViewItem(event);
    this.viewDialogOpen = true;
  }

  onCloseDialog(): void {
    this.viewDialogOpen = false;
    this.selectedViewItem = null;
  }

  exportAudit(format: AuditExportFormat): void {
    if (this.exportLoading) {
      return;
    }

    this.exportLoading = true;
    this.error = null;

    this.auditService
      .export(this.currentParams, format)
      .pipe(finalize(() => (this.exportLoading = false)))
      .subscribe({
        next: (blob) => this.downloadBlob(blob, format),
        error: (err) => {
          this.error = err?.message || 'No se pudo exportar la auditoría.';
          this.logger.error('Failed to export audit events', err);
        },
      });
  }

  formatAction(action: AuditAction): string {
    const labels: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'Creación',
      [AuditAction.UPDATE]: 'Actualización',
      [AuditAction.DELETE]: 'Eliminación',
      [AuditAction.VIEW]: 'Visualización',
      [AuditAction.LOGIN]: 'Inicio de sesión',
      [AuditAction.LOGOUT]: 'Cierre de sesión',
      [AuditAction.EXPORT]: 'Exportación',
      [AuditAction.DOWNLOAD]: 'Descarga',
    };

    return labels[action] ?? action;
  }

  formatSeverity(severity: AuditSeverity): string {
    const labels: Record<AuditSeverity, string> = {
      [AuditSeverity.INFO]: 'Información',
      [AuditSeverity.WARNING]: 'Advertencia',
      [AuditSeverity.ERROR]: 'Error',
      [AuditSeverity.CRITICAL]: 'Crítico',
    };

    return labels[severity] ?? severity;
  }

  formatTargetType(targetType: AuditTargetType): string {
    const labels: Record<AuditTargetType, string> = {
      [AuditTargetType.USER]: 'Usuario',
      [AuditTargetType.PATIENT]: 'Paciente',
      [AuditTargetType.DOCTOR]: 'Doctor',
      [AuditTargetType.APPOINTMENT]: 'Turno',
      [AuditTargetType.SERVICE]: 'Servicio',
      [AuditTargetType.SCHEDULE]: 'Horario',
      [AuditTargetType.AUTH]: 'Autenticación',
      [AuditTargetType.SYSTEM]: 'Sistema',
      [AuditTargetType.OTHER]: 'Otro',
    };

    return labels[targetType] ?? targetType;
  }

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private buildQueryParams(): AuditQueryParams {
    const raw = this.filterForm.value;
    const params: AuditQueryParams = {};

    if (raw.search?.trim()) params.search = raw.search.trim();
    if (raw.from_date) params.from_date = raw.from_date;
    if (raw.to_date) params.to_date = raw.to_date;
    if (raw.actor_id?.trim()) params.actor_id = raw.actor_id.trim();
    if (raw.target_id?.trim()) params.target_id = raw.target_id.trim();
    if (raw.ordering?.trim()) params.ordering = raw.ordering.trim();

    if (Array.isArray(raw.actions) && raw.actions.length) {
      params.actions = raw.actions as AuditAction[];
    }

    if (Array.isArray(raw.severities) && raw.severities.length) {
      params.severities = raw.severities as AuditSeverity[];
    }

    if (Array.isArray(raw.target_types) && raw.target_types.length) {
      params.target_types = raw.target_types as AuditTargetType[];
    }

    const limit = Number(raw.limit);
    if (!isNaN(limit) && limit > 0) {
      params.limit = limit;
    }

    const offset = Number(raw.offset);
    if (!isNaN(offset) && offset >= 0) {
      params.offset = offset;
    }

    return params;
  }

  private toViewItem(event: AuditEventRead): AuditViewItem {
    return {
      ...event,
      createdAtFormatted: this.formatDate(event.created_at),
      actionLabel: this.formatAction(event.action),
      severityLabel: this.formatSeverity(event.severity),
      requestMetadataText: this.formatMetadata(
        event.request_metadata,
        event.metadata_schemas?.request
      ),
      detailMetadataText: this.formatMetadata(
        event.detail_metadata,
        event.metadata_schemas?.detail
      ),
    };
  }

  private formatMetadata(
    metadata: AuditEventRead['detail_metadata'],
    dictionary?: AuditEventRead['metadata_schemas'] extends infer S
      ? S extends { detail?: infer D; request?: infer R }
        ? D | R
        : undefined
      : undefined
  ): string {
    const entries = this.auditService.translateMetadata(metadata ?? {}, dictionary ?? {});

    if (!entries.length) {
      return 'Sin información adicional';
    }

    return entries
      .map((entry) => `${entry.label}: ${entry.value}`)
      .join(' | ');
  }

  private downloadBlob(blob: Blob, format: AuditExportFormat): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const extension = format || 'csv';

    link.href = url;
    link.download = `auditoria.${extension}`;
    link.click();

    window.URL.revokeObjectURL(url);
  }
}
