import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
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
  currentUser: User | null = null;
  activeSection: string = 'profile';
  error: string | null = null;
  loading: boolean = true;

  appointments: any[] = [];
  appointmentHistory: any[] = [];
  notifications: any[] = [];
  documents: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();

    this.appointments = [
      { id: '1', title: 'Cita médica', date: '2025-04-22T10:00:00' },
      { id: '2', title: 'Consulta dental', date: '2025-04-23T14:00:00' }
    ];
    this.appointmentHistory = [
      { id: '3', title: 'Cita pasada', date: '2025-04-20T09:00:00' }
    ];
    this.notifications = [
      { id: '1', message: 'Nueva cita programada', read: false },
      { id: '2', message: 'Recordatorio de cita', read: false }
    ];
    this.documents = [
      { id: '1', name: 'Informe médico.pdf', url: '#' }
    ];
  }

  loadUserProfile(): void {
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userData) => {
          this.currentUser = userData;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los datos del usuario';
          console.error(err);
          this.loading = false;
        }
      });

    this.userService.getUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.error = 'No se pudieron cargar los datos del usuario';
          console.error(err);
          this.loading = false;
        }
      });
  }

  changeSection(section: string): void {
    this.activeSection = section;
  }

  onRescheduleAppointment(event: any): void {
    console.log('Reschedule appointment:', event);
  }

  onCancelAppointment(event: any): void {
    console.log('Cancel appointment:', event);
  }

  markAsRead(notificationId: string): void {
    console.log('Mark notification as read:', notificationId);
  }

  onEditProfile(): void {
    console.log('Edit profile triggered');
  }

  onChangePassword(): void {
    console.log('Change password triggered');
  }

  onLogout(): void {
    this.userService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Logout successful');
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']); 
        },
        error: (err) => {
          console.error('Logout failed, but proceeding with client-side cleanup:', err);
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']); 
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}