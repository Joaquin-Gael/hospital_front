import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule],
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  appointments: AppointmentViewModel[] = [];
  user: UserRead | null = null;
  error: string | null = null;
  loading: boolean = true;
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.appointments.length > 0) {
      this.appointments = this.appointments.filter(appointment => appointment.state == 'waiting');
      this.loading = this.loading;
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
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
    this.appointmentService.getTurnsByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turns: Turn[]) => {
          console.log('Turns received:', turns);
          this.appointments = this.mapTurnsToAppointments(turns);
          this.loading = false;
          this.logger.debug('Appointments loaded successfully', this.appointments);
        },
        error: (err) => {
          console.log('Error in loadAppointments:', err);
          this.error = 'Error al mostrar los turnos';
          this.loading = false;
          this.logger.error('Error al mostrar los turnos: ', err);
        }
      });
  }

  private mapTurnsToAppointments(turns: Turn[]): AppointmentViewModel[] {
    return turns.map(turn => ({
      id: turn.appointment_id ?? turn.id,
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
      ? this.appointments.filter(appointment => appointment.state === 'waiting')
      : this.appointments;
  }

  onReschedule(appointmentId: string): void {
    console.log(`Rescheduling appointment: ${appointmentId}`);
    this.router.navigate(['/reschedule-appointment', appointmentId]);
  }

  onCancel(turnId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar turno',
        message: '¿Estás seguro de que deseas cancelar este turno?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.updateTurnState(turnId, 'cancelled')
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
    console.log('New appointment requested');
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