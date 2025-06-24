import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { StorageService } from '../../../services/core/storage.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Notification, Document } from '../interfaces/user-panel.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentViewModel, Appointment, TurnState, TurnCreate } from '../../../services/interfaces/appointment.interfaces';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { AppointmentsComponent } from '../appointments/appointments.component';
import { HistoryComponent } from '../history/history.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { DocumentsComponent } from '../documents/documents.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    AppointmentsComponent,
    HistoryComponent,
    NotificationsComponent,
    DocumentsComponent,
    ProfileComponent,
    CommonModule,
  ],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly storageService = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  user: UserRead | null = null;
  activeSection: string = 'appointments';
  error: string | null = null;
  loading: boolean = true;

  appointments: AppointmentViewModel[] = [];
  appointmentHistory: AppointmentViewModel[] = [];
  notifications: Notification[] = [
    { id: '1', message: 'Nueva cita programada', read: false, createdAt: new Date('2025-04-21') },
    { id: '2', message: 'Recordatorio de cita', read: false, createdAt: new Date('2025-04-22') },
  ];
  documents: Document[] = [
    {
      id: '1',
      name: 'Informe médico.pdf',
      url: '#',
      type: 'PDF',
      date: '2025-04-20T00:00:00',
      downloadUrl: '#',
    },
  ];

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

  private loadAppointments(userId: number): void {
    this.appointmentService.getAppointments(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (appointments) => {
        const viewModels = appointments.map(this.mapToViewModel);
        this.appointments = viewModels.filter(a => a.state === TurnState.PENDING);
        this.appointmentHistory = viewModels.filter(a => a.state !== TurnState.PENDING);
      },
      error: (err) => {
        this.logger.error('Failed to load appointments', err);
        this.appointments = [];
        this.appointmentHistory = [];
      },
    });
  }

  private mapToViewModel(appointment: Appointment): AppointmentViewModel {
    const date = new Date(appointment.date);
    return {
      id: appointment.id,
      turnId: appointment.turn_id,
      date: appointment.date,
      time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      specialty: 'Cardiología', // TODO: Obtener desde service_id (ServiceService)
      doctorName: 'Dr. Juan Pérez', // TODO: Obtener desde doctor_id (DoctorService)
      location: 'Clínica Central', // TODO: Obtener desde service_id o doctor_id
      state: appointment.state,
    };
  }

  onNewAppointment(): void {
    if (!this.user) {
      this.logger.error('No user data for new appointment');
      return;
    }
    const turn: TurnCreate = {
      reason: 'Consulta médica',
      state: TurnState.PENDING,
      date: '2025-04-24T10:00:00',
      date_limit: '2025-04-24T12:00:00',
      doctor_id: '550e8400-e29b-41d4-a716-446655440000',
      service_id: '550e8400-e29b-41d4-a716-446655440001',
    };
    this.appointmentService.createTurn(turn).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newTurn) => {
        this.logger.info('Turn created', newTurn);
        this.loadAppointments(this.user!.id);
      },
      error: (err) => this.logger.error('Failed to create turn', err),
    });
  }

  onCancelAppointment(turnId: number): void {
    if (!this.user) {
      this.logger.error('No user data for cancel appointment');
      return;
    }
    this.appointmentService.deleteTurn(turnId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.logger.info('Turn deleted', { turnId });
        this.loadAppointments(this.user!.id);
      },
      error: (err) => this.logger.error('Failed to delete turn', err),
    });
  }

  onRescheduleAppointment(appointmentId: number): void {
    this.logger.info('Reschedule requested', { appointmentId });
    // TODO: Implementar reprogramación (ej. eliminar turno actual y crear uno nuevo)
  }

  changeSection(section: string): void {
    this.activeSection = section;
    this.logger.info('Section changed', { section });
  }

  onViewDetails(appointment: AppointmentViewModel): void {
    this.logger.info('View details', appointment);
    // TODO: Implementar lógica para mostrar detalles (ej. modal)
  }

  onDownloadReceipt(appointment: AppointmentViewModel): void {
    this.logger.info('Download receipt', appointment);
    // TODO: Implementar lógica para descargar comprobante
  }

  markAsRead(notificationId: string): void {
    this.logger.info('Mark notification as read', { notificationId });
    this.notifications = this.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
  }

  onEditProfile(): void {
    this.logger.info('Edit profile');
    this.activeSection = 'profile';
  }

  onChangePassword(): void {
    this.logger.info('Change password');
    // TODO: Implementar cambio de contraseña
  }

  onLogout(): void {
    this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.storageService.clearStorage();
        this.logger.info('Logout successful, redirecting to /login');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.storageService.clearStorage();
        this.logger.error('Failed to logout', err);
        this.router.navigate(['/login']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}