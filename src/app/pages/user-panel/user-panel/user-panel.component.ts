import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { User, Appointment, Notification, Document } from '../interfaces/user-panel.interfaces';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  imports: [
    SidebarComponent,
    HeaderComponent,
    AppointmentsComponent,
    HistoryComponent,
    NotificationsComponent,
    DocumentsComponent,
    ProfileComponent,
    CommonModule
  ],
  standalone: true
})
export class UserPanelComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  user: User | null = null;
  activeSection: string = 'profile';
  error: string | null = null;
  loading: boolean = true;

  appointments: Appointment[] = [
    {
      id: '1',
      title: 'Cita médica',
      date: '2025-04-22T10:00:00',
      time: '10:00',
      specialty: 'Cardiología',
      doctorName: 'Dr. Juan Pérez',
      location: 'Consultorio 3',
      status: 'pending'
    },
    {
      id: '2',
      title: 'Consulta dental',
      date: '2025-04-23T14:00:00',
      time: '14:00',
      specialty: 'Odontología',
      doctorName: 'Dra. María Gómez',
      location: 'Consultorio 5',
      status: 'pending'
    }
  ];
  appointmentHistory: Appointment[] = [
    {
      id: '3',
      title: 'Cita pasada',
      date: '2025-04-20T09:00:00',
      time: '09:00',
      specialty: 'Dermatología',
      doctorName: 'Dr. Carlos López',
      location: 'Consultorio 2',
      status: 'completed'
    }
  ];
  notifications: Notification[] = [
    { id: '1', message: 'Nueva cita programada', read: false, createdAt: new Date('2025-04-21') },
    { id: '2', message: 'Recordatorio de cita', read: false, createdAt: new Date('2025-04-22') }
  ];
  documents: Document[] = [
    {
      id: '1',
      name: 'Informe médico.pdf',
      url: '#',
      type: 'PDF',
      date: '2025-04-20T00:00:00',
      downloadUrl: '#'
    }
  ];

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      console.log('UserPanel: No autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('UserPanel: Iniciando carga de usuario, activeSection:', this.activeSection);

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        console.log('UserPanel: Usuario cargado:', user, 'loading:', this.loading);
        if (!user) {
          this.error = 'No se encontraron datos del usuario';
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario';
        this.loading = false;
        console.error('UserPanel: Error al cargar usuario:', err.message);
        this.router.navigate(['/login']);
      }
    });
  }

  changeSection(section: string): void {
    this.activeSection = section;
    console.log('UserPanel: Sección cambiada a:', section);
  }

  onRescheduleAppointment(appointmentId: string): void {
    console.log('UserPanel: Reprogramar cita:', appointmentId);
  }

  onCancelAppointment(appointmentId: string): void {
    console.log('UserPanel: Cancelar cita:', appointmentId);
  }

  onNewAppointment(): void {
    console.log('UserPanel: Solicitar nuevo turno');
    // TODO: Implementar lógica para agendar nuevo turno (ej. abrir modal o redirigir)
  }

  onViewDetails(appointment: Appointment): void {
    console.log('UserPanel: Ver detalles de cita:', appointment);
    // TODO: Implementar lógica para mostrar detalles (ej. abrir modal)
  }

  onDownloadReceipt(appointment: Appointment): void {
    console.log('UserPanel: Descargar comprobante de cita:', appointment);
    // TODO: Implementar lógica para descargar comprobante
  }

  markAsRead(notificationId: string): void {
    console.log('UserPanel: Marcar notificación como leída:', notificationId);
    this.notifications = this.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
  }

  onEditProfile(): void {
    console.log('UserPanel: Editar perfil');
    this.activeSection = 'profile';
  }

  onChangePassword(): void {
    console.log('UserPanel: Cambiar contraseña');
  }

  onLogout(): void {
    this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        localStorage.removeItem('rememberEmail'); // Limpiar email guardado
        console.log('UserPanel: Logout exitoso, redirigiendo a /login');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('UserPanel: Error al cerrar sesión:', err.message);
        localStorage.removeItem('rememberEmail'); // Limpiar incluso si hay error
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}