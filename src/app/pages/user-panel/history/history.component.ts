import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppointmentViewModel, Turn } from '../../../services/interfaces/appointment.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import {
  ViewDialogComponent,
  ViewDialogColumn,
} from '../../../shared/view-dialog/view-dialog.component';
import { TurnDocumentsService } from '../../../services/turn-documents/turn-documents.service';
import { downloadBlob } from '../../../shared/utils/download.utils';
import {
  DataTableActionsConfig,
  DataTableComponent,
  TableColumn,
} from '../../../shared/data-table/data-table.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    ViewDialogComponent,
    DataTableComponent,
  ],
})
export class HistoryComponent implements OnInit, OnDestroy {
  @Input() appointments: AppointmentViewModel[] = [];
  @Input() loading: boolean = false;
  @Output() viewDetails = new EventEmitter<AppointmentViewModel>();
  @Output() downloadReceipt = new EventEmitter<AppointmentViewModel>();

  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly turnDocumentsService = inject(TurnDocumentsService);

  localAppointments: AppointmentViewModel[] = [];
  localLoading: boolean = true;
  error: string | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly downloadingTurnIds = new Set<string>();

  readonly tableActions: DataTableActionsConfig = {
    view: true,
    edit: false,
    delete: false,
    ban: false,
    unban: false,
    download: true,
  };

  // View dialog properties (siguiendo el patrón del ViewDialogComponent real)
  viewDialogOpen = false;
  viewDialogItem: any = {};
  viewDialogTitle = '';

  tableColumns: TableColumn[] = [
    {
      key: 'date',
      label: 'Fecha',
      format: (value: string) => `${this.formatShortDate(value)}`,
    },
    {
      key: 'specialty',
      label: 'Especialidad',
    },
    {
      key: 'doctorName',
      label: 'Médico',
    },
    {
      key: 'state',
      label: 'Estado',
      format: (value: string) => this.getStateText(value),
    },
  ];

  // Configuración de columnas para el ViewDialog
  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'reason', label: 'Motivo' },
    {
      key: 'date',
      label: 'Fecha',
      format: (value: string) => this.formatShortDate(value)
    },
    { key: 'time', label: 'Hora' },
    { key: 'specialty', label: 'Especialidad' },
    { key: 'doctorName', label: 'Médico' },
    {
      key: 'state',
      label: 'Estado',
      format: (value: string) => this.getStateText(value)
    },
  ];

  ngOnInit(): void {
    if (this.appointments.length > 0) {
      this.localAppointments = this.appointments.filter(appointment => appointment.state !== 'waiting');
      this.localLoading = this.loading;
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        if (!user) {
          this.error = 'No se encontraron datos del usuario';
          this.logger.error('No user data found');
          this.router.navigate(['/login']);
          this.localLoading = false;
          return;
        }
        this.loadAppointments(user.id);
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario';
        this.localLoading = false;
        this.logger.error('Failed to load user', err);
        this.router.navigate(['/login']);
      },
    });
  }

  private loadAppointments(userId: string): void {
    this.localLoading = true;
    this.appointmentService.getTurnsByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turns: Turn[]) => {
          this.localAppointments = this.mapTurnsToAppointments(turns);
          this.localLoading = false;
          this.logger.debug('History appointments loaded successfully', this.localAppointments);
        },
        error: (err) => {
          this.error = 'Error al cargar el historial de turnos';
          this.localLoading = false;
          this.logger.error('Error loading history appointments', err);
        },
      });
  }

  private mapTurnsToAppointments(turns: Turn[]): AppointmentViewModel[] {
    return turns
      .filter(turn => turn.state !== 'waiting') // Excluye turnos en 'waiting'
      .map(turn => ({
        id: turn.appointment_id ?? turn.id,
        reason: turn.reason,
        turnId: turn.id,
        date: turn.date,
        time: turn.time.split(':').slice(0, 2).join(':'),
        specialty: turn.service?.[0]?.name ?? 'Sin especialidad',
        doctorName: turn.doctor ? `${turn.doctor.first_name} ${turn.doctor.last_name}`.trim() : 'Sin médico asignado',
        state: turn.state,
        paymentStatus: turn.payment?.status ?? null,
        paymentUrl: turn.payment?.payment_url ?? turn.payment_url ?? null,
        paymentId: turn.payment?.id ?? null,
        paymentGatewaySessionId: turn.payment?.gateway_session_id ?? null,
        paymentMethod: turn.payment?.payment_method ?? turn.payment?.provider ?? null,
        paymentMetadata: turn.payment?.metadata ?? null,
        paymentMetadataEntries: [],
      }));
  }

  get filteredAppointments(): AppointmentViewModel[] {
    return this.appointments.length > 0
      ? this.appointments.filter(appointment => appointment.state !== 'waiting')
      : this.localAppointments;
  }

  get isDownloadingAny(): boolean {
    return this.downloadingTurnIds.size > 0;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  formatFullDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Método para mapear estados a texto mostrado en el template
  getStateText(state: string): string {
    switch (state) {
      case 'finished':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Estado desconocido';
    }
  }

  // Implementación del ViewDialog (usando la interfaz correcta del componente)
  onViewDetails(appointment: AppointmentViewModel): void {
    this.viewDialogItem = appointment;
    this.viewDialogTitle = `Detalles de la Cita - ${appointment.specialty}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for appointment', appointment);

    // Emitir el evento para compatibilidad con componentes padre
    this.viewDetails.emit(appointment);
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogItem = {};
  }

  onDownloadReceipt(appointment: AppointmentViewModel): void {
    const turnId = appointment.turnId;

    if (!turnId) {
      this.notificationService.error('No se encontró el identificador del turno.');
      this.logger.error('Missing turnId for appointment', appointment);
      return;
    }

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
          const filename = this.buildReceiptFilename(appointment);
          downloadBlob(blob, filename);
          this.notificationService.success('Comprobante descargado correctamente');
          this.downloadReceipt.emit(appointment);
        },
        error: (err) => {
          this.notificationService.error('No se pudo descargar el comprobante. Intenta nuevamente.');
          this.logger.error('Error downloading turn receipt', { turnId, err });
        },
      });
  }

  isDownloading(turnId: string): boolean {
    return this.downloadingTurnIds.has(turnId);
  }

  private buildReceiptFilename(appointment: AppointmentViewModel): string {
    const date = new Date(appointment.date).toISOString().split('T')[0];
    const normalizedSpecialty = appointment.specialty
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `turno-${normalizedSpecialty || 'hospital'}-${date}.pdf`;
  }

  trackById(index: number, item: AppointmentViewModel): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
