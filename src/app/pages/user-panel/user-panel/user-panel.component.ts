import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { StorageService } from '../../../services/core/storage.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { AppointmentsComponent } from '../appointments/appointments.component';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    RouterOutlet,
    CommonModule,
    MatDialogModule,
  ],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly appointmentService = inject(AppointmentService);

  user: UserRead | null = null;
  appointments: AppointmentViewModel[] = [];
  error: string | null = null;
  loading: boolean = true;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info('User not authenticated, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (userRead) => {
        this.user = userRead ? { ...userRead } : null;
        this.loading = false;
        if (!this.user) {
          this.error = 'No se encontraron datos del usuario';
          this.logger.error('No user data found');
          this.router.navigate(['/login']);
          return;
        }
        this.loadAppointments(this.user.id);
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario';
        this.loading = false;
        this.logger.error('Failed to load user', err);
        this.router.navigate(['/login']);
      },
    });
  }

  private loadAppointments(userId: string): void {
    this.appointmentService.getTurnsByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (turns: Turn[]) => {
          this.appointments = this.mapTurnsToAppointments(turns);
          this.logger.debug('Appointments loaded successfully', this.appointments);
        },
        (error: any) => {
          this.logger.error('Failed to load appointments', error);
          this.notificationService.error('No se pudieron cargar los turnos');
          this.appointments = [];
        }
      );
  }

  private mapTurnsToAppointments(turns: Turn[]): AppointmentViewModel[] {
    return turns.map(turn => ({
      id: turn.appointment_id ?? turn.id,
      turnId: turn.id,
      date: turn.date,
      time: turn.time.split(':').slice(0, 2).join(':'), // Convertir "23:20:31" a "23:20"
      specialty: turn.service?.[0]?.name ?? 'Sin especialidad',
      doctorName: turn.doctor ? `${turn.doctor.first_name} ${turn.doctor.last_name}`.trim() : 'Sin médico asignado',
      state: turn.state,
    }));
  }

  onReschedule(appointmentId: string): void {
    this.logger.debug(`Rescheduling appointment: ${appointmentId}`);
    // Implementar lógica para reprogramar (p.ej., redirigir a un formulario)
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
        this.appointmentService.deleteTurn(turnId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Turno cancelado correctamente');
              if (this.user?.id) {
                this.loadAppointments(this.user.id); // Recargar turnos
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
    this.router.navigate(['/new-appointment']);
  }

  onLogout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.storageService.clearStorage();
            this.notificationService.success('Sesión cerrada correctamente', {
              duration: 4000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
            this.router.navigate(['/login']);
          },
          error: (err) => {
            this.storageService.clearStorage();
            this.logger.error('Failed to logout', err);
            this.router.navigate(['/login']);
          },
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}