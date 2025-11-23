import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
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
  private readonly paymentStatusMaxAttempts = 5;
  private readonly paymentStatusBaseDelayMs = 2000;
  private paymentStatusTimers: Record<string, ReturnType<typeof setTimeout> | null> = {};
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
          this.startInitialPaymentStatusChecks();
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
      paymentId: turn.payment?.id ?? null,
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
      const wasOpened = this.openPaymentUrl(appointment.paymentUrl);

      if (wasOpened) {
        this.startPaymentStatusCheck(appointment.turnId, true);
        return;
      }

      this.logger.warn(
        'Payment URL could not be opened, attempting to recreate session',
        {
          turnId: appointment.turnId,
          paymentUrl: appointment.paymentUrl,
        }
      );
    }

    this.retryResumePaymentWithNewSession(appointment);
  }

  private openPaymentUrl(url: string): boolean {
    try {
      const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

      if (!openedWindow || openedWindow.closed) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to open payment URL', error);
      return false;
    }
  }

  private retryResumePaymentWithNewSession(
    appointment: AppointmentViewModel
  ): void {
    this.setPaymentRetrying(appointment.turnId, true);

    this.paymentsService
      .recreateTurnPaymentSession(appointment.turnId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setPaymentRetrying(appointment.turnId, false))
      )
      .subscribe({
        next: ({ payment, payment_url }) => {
          const redirectUrl = payment_url ?? payment?.payment_url ?? null;

          this.updateAppointmentPayment(appointment.turnId, {
            paymentUrl: redirectUrl,
            paymentStatus: payment?.status ?? appointment.paymentStatus,
            paymentGatewaySessionId: this.extractGatewaySessionId(payment ?? null),
            paymentId: payment?.id ?? appointment.paymentId,
            paymentMethod:
              payment?.payment_method ??
              payment?.provider ??
              appointment.paymentMethod,
            paymentMetadata: payment?.metadata ?? appointment.paymentMetadata,
          });

          if (!redirectUrl) {
            this.notificationService.error(
              'No se pudo obtener un enlace de pago. Intenta nuevamente más tarde.'
            );
            return;
          }

          const wasOpened = this.openPaymentUrl(redirectUrl);

          if (!wasOpened) {
            this.notificationService.error(
              'No pudimos abrir el nuevo enlace de pago. Intenta nuevamente más tarde.'
            );
            return;
          }

          this.startPaymentStatusCheck(appointment.turnId, true);
        },
        error: (err) => {
          this.logger.error('Failed to recreate payment session', err);

          const message = this.buildResumePaymentErrorMessage(err);

          this.notificationService.error(message);
        },
      });
  }

  private buildResumePaymentErrorMessage(error: unknown): string {
    const message =
      error instanceof Error
        ? error.message
        : 'Error desconocido al reanudar el pago';

    if (this.isExpiredPaymentError(error)) {
      return (
        'El enlace de pago ya no está disponible y no pudimos generar uno nuevo. ' +
        'Por favor, intenta nuevamente más tarde o comunícate con soporte.'
      );
    }

    return `No pudimos reanudar el pago (${message}). Por favor, intenta de nuevo más tarde.`;
  }

  private isExpiredPaymentError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : `${error ?? ''}`;

    return /404|not found|expir/i.test(message);
  }

  private updateAppointmentPayment(
    turnId: string,
    updates: {
      paymentUrl?: string | null;
      paymentStatus?: PaymentStatus | null;
      paymentGatewaySessionId?: string | null;
      paymentId?: string | null;
      paymentMethod?: PaymentMethod | string | null;
      paymentMetadata?: Record<string, unknown> | null;
    }
  ): void {
    this.appointments = this.appointments.map((appointment) =>
      appointment.turnId !== turnId
        ? appointment
        : {
            ...appointment,
            paymentUrl:
              updates.paymentUrl !== undefined
                ? updates.paymentUrl
                : appointment.paymentUrl,
            paymentStatus:
              updates.paymentStatus !== undefined
                ? updates.paymentStatus
                : appointment.paymentStatus,
            paymentGatewaySessionId:
              updates.paymentGatewaySessionId !== undefined
                ? updates.paymentGatewaySessionId
                : appointment.paymentGatewaySessionId,
            paymentId:
              updates.paymentId !== undefined
                ? updates.paymentId
                : appointment.paymentId,
            paymentMethod:
              updates.paymentMethod !== undefined
                ? updates.paymentMethod
                : appointment.paymentMethod,
            paymentMetadata:
              updates.paymentMetadata !== undefined
                ? updates.paymentMetadata
                : appointment.paymentMetadata,
            paymentMetadataEntries: this.buildPaymentMetadataEntries(
              updates.paymentMetadata ?? appointment.paymentMetadata
            ),
          }
    );
  }

  private setPaymentRetrying(turnId: string, value: boolean): void {
    this.paymentRetrying = {
      ...this.paymentRetrying,
      [turnId]: value,
    };
  }

  private startInitialPaymentStatusChecks(): void {
    this.appointments.forEach((appointment) =>
      this.startPaymentStatusCheck(appointment.turnId, true)
    );
  }

  private shouldMonitorPaymentStatus(
    appointment: AppointmentViewModel
  ): boolean {
    const hasActionableStatus =
      appointment.paymentStatus === PaymentStatus.PENDING ||
      appointment.paymentStatus === PaymentStatus.REQUIRES_ACTION ||
      appointment.paymentStatus === PaymentStatus.FAILED;

    return (
      hasActionableStatus &&
      (!!appointment.paymentId || !!appointment.paymentGatewaySessionId)
    );
  }

  private startPaymentStatusCheck(turnId: string, immediate = false): void {
    const appointment = this.appointments.find((item) => item.turnId === turnId);

    if (!appointment || !this.shouldMonitorPaymentStatus(appointment)) {
      return;
    }

    this.schedulePaymentStatusCheck(appointment, 1, immediate);
  }

  private schedulePaymentStatusCheck(
    appointment: AppointmentViewModel,
    attempt: number,
    immediate: boolean
  ): void {
    const delay = immediate
      ? 0
      : this.paymentStatusBaseDelayMs * Math.pow(2, attempt - 1);

    this.clearPaymentStatusTimer(appointment.turnId);

    this.paymentStatusTimers[appointment.turnId] = setTimeout(() => {
      this.fetchPaymentStatus(appointment.turnId, attempt);
    }, delay);
  }

  private fetchPaymentStatus(turnId: string, attempt: number): void {
    const appointment = this.appointments.find((item) => item.turnId === turnId);

    if (!appointment || !this.shouldMonitorPaymentStatus(appointment)) {
      return;
    }

    const status$ = appointment.paymentId
      ? this.paymentsService.get(appointment.paymentId)
      : appointment.paymentGatewaySessionId
        ? this.paymentsService.getStatusBySession(
            appointment.paymentGatewaySessionId
          )
        : null;

    if (!status$) {
      return;
    }

    status$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.handlePaymentStatusResponse(turnId, payment);

          if (
            !this.isTerminalPaymentStatus(payment.status) &&
            attempt < this.paymentStatusMaxAttempts
          ) {
            this.schedulePaymentStatusCheck(appointment, attempt + 1, false);
          }
        },
        error: (err) => {
          this.logger.error('Failed to fetch payment status', err);
          this.notificationService.error(
            'No se pudo verificar el estado del pago. Intenta nuevamente.'
          );

          if (attempt < this.paymentStatusMaxAttempts) {
            this.schedulePaymentStatusCheck(appointment, attempt + 1, false);
          }
        },
      });
  }

  private handlePaymentStatusResponse(turnId: string, payment: PaymentRead): void {
    this.updateAppointmentPayment(turnId, {
      paymentId: payment.id ?? null,
      paymentUrl: payment.payment_url ?? null,
      paymentStatus: payment.status ?? null,
      paymentGatewaySessionId: this.extractGatewaySessionId(payment),
      paymentMethod: payment.payment_method ?? payment.provider ?? null,
      paymentMetadata: payment.metadata ?? null,
    });

    if (payment.status === PaymentStatus.SUCCEEDED) {
      this.notificationService.success('Pago confirmado correctamente.');
      this.clearPaymentStatusTimer(turnId);
      return;
    }

    if (payment.status === PaymentStatus.CANCELED) {
      this.notificationService.info('El pago fue cancelado.');
      this.clearPaymentStatusTimer(turnId);
    }
  }

  private isTerminalPaymentStatus(status: PaymentStatus | null): boolean {
    return (
      status === PaymentStatus.SUCCEEDED || status === PaymentStatus.CANCELED
    );
  }

  private clearPaymentStatusTimer(turnId: string): void {
    const timer = this.paymentStatusTimers[turnId];

    if (timer) {
      clearTimeout(timer);
    }

    delete this.paymentStatusTimers[turnId];
  }

  private clearAllPaymentStatusTimers(): void {
    Object.keys(this.paymentStatusTimers).forEach((turnId) =>
      this.clearPaymentStatusTimer(turnId)
    );
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
    this.clearAllPaymentStatusTimers();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
