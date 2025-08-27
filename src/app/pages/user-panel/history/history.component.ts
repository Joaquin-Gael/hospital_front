import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HistoryComponent implements OnInit, OnDestroy {
  @Input() appointments: AppointmentViewModel[] = [];
  @Input() loading: boolean = false;
  @Output() viewDetails = new EventEmitter<AppointmentViewModel>();
  @Output() downloadReceipt = new EventEmitter<AppointmentViewModel>();

  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  localAppointments: AppointmentViewModel[] = [];
  localLoading: boolean = true;
  error: string | null = null;
  private readonly destroy$ = new Subject<void>();

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
      }));
  }

  get filteredAppointments(): AppointmentViewModel[] {
    return this.appointments.length > 0 
      ? this.appointments.filter(appointment => appointment.state !== 'waiting')
      : this.localAppointments;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // Método para mapear estados a texto mostrado en el template
  getStateText(state: string): string {
    switch (state) {
      case 'finished':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  }

  onViewDetails(appointment: AppointmentViewModel): void {
    this.viewDetails.emit(appointment);
  }

  onDownloadReceipt(appointment: AppointmentViewModel): void {
    this.downloadReceipt.emit(appointment);
  }

  trackById(index: number, item: AppointmentViewModel): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}