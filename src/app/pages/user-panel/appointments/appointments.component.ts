import { Component, OnInit, OnDestroy, inject } from '@angular/core';  // Quita inputs/outputs innecesarios
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';  // Agrega para navigate
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';  // Agrega para dialog
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';  // Agrega para getUser
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';  // Agrega para notifications
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';  // Agrega para confirm

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule],  // Agrega MatDialogModule si usas dialog
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  appointments: AppointmentViewModel[] = [];
  user: UserRead | null = null;  // Lo cargamos internamente
  error: string | null = null;
  loading: boolean = true;
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    console.log('Appointments ngOnInit started');  // Depura: Debería aparecer en consola

    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (userRead) => {
        console.log('User data received:', userRead);  // Depura
        if (!userRead) {
          this.error = 'No se encontraron datos del usuario';
          this.logger.error('No user data found');
          this.router.navigate(['/login']);
          return;
        }
        this.user = userRead;
        this.loading = false;
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
    this.appointmentService.getTurnsByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turns: Turn[]) => {
          console.log('Turns received:', turns); 
          this.appointments = this.mapTurnsToAppointments(turns);
          this.logger.debug('Appointments loaded successfully', this.appointments);
        },  
        error: (err) => {
          console.log('Error in loadAppointments:', err); 
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

  onReschedule(appointmentId: string): void {
    console.log(`Rescheduling appointment: ${appointmentId}`);  // Depura
    this.router.navigate(['/reschedule-appointment', appointmentId]);
  }

  onCancel(turnId: string): void {
    console.log(`Canceling turn: ${turnId}`);  // Depura
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar turno',
        message: '¿Estás seguro de que deseas cancelar este turno?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.deleteTurn(turnId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Turno cancelado correctamente');
              if (this.user?.id) {
                this.loadAppointments(this.user.id);  // Recarga después de cancelar
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

  // Funciones de fecha quedan iguales
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}