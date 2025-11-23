import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  AppointmentViewModel,
  Turn,
  TurnRescheduleRequest,
  TurnState,
} from '../../../services/interfaces/appointment.interfaces';
import {
  PaymentMethod,
  PaymentRead,
  PaymentStatus,
} from '../../../services/interfaces/payment.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { RescheduleTurnDialogComponent } from '../reschedule-turn-dialog/reschedule-turn-dialog.component';
import { PaymentsService } from '../../../services/payments/payments.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LoadingSpinnerComponent,
    RescheduleTurnDialogComponent,
  ],
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  appointments: AppointmentViewModel[] = [];
  user: UserRead | null = null;
  error: string | null = null;
  loading: boolean = true;
  paymentRetrying: Record<string, boolean> = {};
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.appointments.length > 0) {
      this.appointments = this.appointments.filter(
        (appointment) => appointment.state == 'waiting'
      );
      this.loading = this.loading;
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userRead) => {
          console.log('User data received:', userRead);
          if (!userRead) {
            this.error = 'No se encontraron datos del usuario';
            this.logger.error('No user data found');
            this.router.navigate(['/login']);
            this.loading = false;
            return;
          }
          this.user = userRead;
          this.loadAppointments(this.user.id);
        },
        error: (err) => {
          console.log('Error loading user:', err);
          this.error = 'Error al cargar los datos del usuario';
          this.loading = false;
          this.logger.error('Failed to load user', err);
          this.router.navigate(['/login']);
        },
      });
  }

  private loadAppointments(userId: string): void {
    console.log('loadAppointments called with ID:', userId);
    this.loading = true; // Aseguramos que loading esté activo
    this.appointmentService
      .getTurnsByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turns: Turn[]) => {
          console.log('Turns received:', turns);
          this.appointments = this.mapTurnsToAppointments(turns);
          this.loading = false;
          this.logger.debug(
            'Appointments loaded successfully',
            this.appointments
          );
        },
        error: (err) => {
          console.log('Error in loadAppointments:', err);
          this.error = 'Error al mostrar los turnos';
          this.loading = false;
          this.logger.error('Error al mostrar los turnos: ', err);
        },
      });
  }

  private mapTurnsToAppointments(turns: Turn[]): AppointmentViewModel[] {
    return turns.map((turn) => ({
      id: turn.appointment_id ?? turn.id,
      turnId: turn.id,
      date: turn.date,
      time: turn.time.split(':').slice(0, 2).join(':'),
      specialty: turn.service?.[0]?.name ?? 'Sin especialidad',
      doctorName: turn.doctor
        ? `${turn.doctor.first_name} ${turn.doctor.last_name}`.trim()
        : 'Sin médico asignado',
      state: turn.state,
      paymentStatus: turn.payment?.status ?? null,
      paymentUrl: turn.payment?.payment_url ?? turn.payment_url ?? null,
      paymentGatewaySessionId: this.extractGatewaySessionId(turn.payment),
      paymentMethod: turn.payment?.payment_method ?? turn.payment?.provider ?? null,
      paymentMetadata: turn.payment?.metadata ?? null,
      paymentMetadataEntries: this.buildPaymentMetadataEntries(
        turn.payment?.metadata ?? null
      ),
    }));
  }

  private buildPaymentMetadataEntries(
    metadata: Record<string, unknown> | null
  ): { label: string; value: string }[] {
    if (!metadata) {
      return [];
    }

    const labelMap: Record<string, string> = {
      health_insurance: 'Obra social',
      discount: 'Descuento',
      coupon: 'Cupón',
      plan: 'Plan',
    };

    return Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => ({
        label: labelMap[key] ?? this.toTitleCase(key.replace(/_/g, ' ')),
        value: this.formatMetadataValue(value),
      }));
  }

  private formatMetadataValue(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return `${value}`;
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    return JSON.stringify(value);
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  }

  get filteredAppointments(): AppointmentViewModel[] {
    return this.appointments.length > 0
      ? this.appointments.filter(
          (appointment) => appointment.state === 'waiting'
        )
      : this.appointments;
  }

  getPaymentStatusLabel(status: PaymentStatus | null): string {
    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return 'Pago completado';
      case PaymentStatus.PENDING:
        return 'Pago pendiente';
      case PaymentStatus.REQUIRES_ACTION:
        return 'Acción requerida';
      case PaymentStatus.FAILED:
        return 'Pago fallido';
      case PaymentStatus.CANCELED:
        return 'Pago cancelado';
      default:
        return 'Sin información de pago';
    }
  }

  getPaymentStatusClass(status: PaymentStatus | null): string {
    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return 'payment-status--success';
      case PaymentStatus.PENDING:
      case PaymentStatus.REQUIRES_ACTION:
        return 'payment-status--pending';
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELED:
        return 'payment-status--error';
      default:
        return 'payment-status--none';
    }
  }

  getPaymentMethodLabel(paymentMethod: PaymentMethod | string | null): string {
    if (!paymentMethod) {
      return 'Método no especificado';
    }

    const methodLabels: Record<string, string> = {
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.TRANSFER]: 'Transferencia',
      [PaymentMethod.PIX]: 'Pix',
      [PaymentMethod.OTHER]: 'Otro',
    };

    return methodLabels[paymentMethod] ?? this.toTitleCase(`${paymentMethod}`);
  }

  shouldShowResumePayment(appointment: AppointmentViewModel): boolean {
    const isRetryableStatus =
      appointment.paymentStatus === PaymentStatus.PENDING ||
      appointment.paymentStatus === PaymentStatus.FAILED;
    const hasLinkOrSession =
      !!appointment.paymentUrl || !!appointment.paymentGatewaySessionId;

    return isRetryableStatus && hasLinkOrSession;
  }

  isPaymentRetrying(turnId: string): boolean {
    return Boolean(this.paymentRetrying[turnId]);
  }

  onResumePayment(appointment: AppointmentViewModel): void {
    if (this.isPaymentRetrying(appointment.turnId)) {
      return;
    }

    if (
      appointment.paymentUrl &&
      appointment.paymentStatus === PaymentStatus.PENDING
    ) {
      this.openPaymentUrl(appointment.paymentUrl);
      return;
    }

    this.setPaymentRetrying(appointment.turnId, true);

    this.paymentsService
      .recreateTurnPaymentSession(appointment.turnId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ payment, payment_url }) => {
          const redirectUrl = payment_url ?? payment?.payment_url ?? null;

          this.updateAppointmentPayment(
            appointment.turnId,
            redirectUrl,
            payment?.status ?? appointment.paymentStatus,
            this.extractGatewaySessionId(payment ?? null)
          );

          if (redirectUrl) {
            this.openPaymentUrl(redirectUrl);
          } else {
            this.notificationService.error(
              'No se pudo obtener un enlace de pago. Intenta nuevamente más tarde.'
            );
          }

          this.setPaymentRetrying(appointment.turnId, false);
        },
        error: (err) => {
          this.logger.error('Failed to recreate payment session', err);
          this.notificationService.error(
            'No pudimos reanudar el pago. Por favor, intenta de nuevo.'
          );
          this.setPaymentRetrying(appointment.turnId, false);
        },
      });
  }

  private openPaymentUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private updateAppointmentPayment(
    turnId: string,
    paymentUrl: string | null,
    paymentStatus: PaymentStatus | null,
    gatewaySessionId: string | null
  ): void {
    this.appointments = this.appointments.map((appointment) =>
      appointment.turnId !== turnId
        ? appointment
        : {
            ...appointment,
            paymentUrl,
            paymentStatus,
            paymentGatewaySessionId: gatewaySessionId,
          }
    );
  }

  private setPaymentRetrying(turnId: string, value: boolean): void {
    this.paymentRetrying = {
      ...this.paymentRetrying,
      [turnId]: value,
    };
  }

  private extractGatewaySessionId(payment: PaymentRead | null): string | null {
    if (!payment) {
      return null;
    }

    const metadata = payment.gateway_metadata as
      | { session_id?: string; sessionId?: string }
      | null
      | undefined;

    return (
      payment.gateway_session_id ??
      metadata?.session_id ??
      metadata?.sessionId ??
      null
    );
  }

  onReschedule(turnId: string): void {
    const appointment = this.appointments.find((item) => item.turnId === turnId);
    
    this.loading = true;
    
    this.appointmentService.getTurnById(turnId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turn: Turn) => {
          this.loading = false;
          const dialogRef = this.dialog.open(RescheduleTurnDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: {
              currentDate: turn.date,
              currentTime: turn.time,
              specialtyId: turn.service?.[0]?.specialty_id
            },
          });

          dialogRef
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result?: TurnRescheduleRequest) => {
              if (!result) {
                return;
              }

              this.loading = true;
              this.appointmentService
                .rescheduleTurn(turnId, result)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.notificationService.success('Turno reprogramado correctamente');
                    if (this.user?.id) {
                      this.loadAppointments(this.user.id);
                    } else {
                      this.loading = false;
                    }
                  },
                  error: (err) => {
                    this.notificationService.error('Error al reprogramar el turno');
                    this.logger.error('Failed to reschedule turn', err);
                    this.loading = false;
                  },
                });
            });
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.error('Error al cargar los datos del turno');
          this.logger.error('Failed to load turn details', err);
        }
      });
  }

  onCancel(turnId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar turno',
        message: '¿Estás seguro de que deseas cancelar este turno?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.appointmentService
          .updateTurnState(turnId, 'cancelled')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Turno cancelado correctamente');
              if (this.user?.id) {
                this.loadAppointments(this.user.id);
              }
            },
            error: (err) => {
              this.notificationService.error('Error al cancelar el turno');
              this.logger.error('Failed to cancel turn', err);
            },
          });
      }
    });
  }

  onNewAppointment(): void {
    this.router.navigate(['/shifts']);
  }

  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
  }

  getDayNumber(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }

  getMonthName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'long' }).toLowerCase();
  }

  trackById(index: number, item: AppointmentViewModel): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
