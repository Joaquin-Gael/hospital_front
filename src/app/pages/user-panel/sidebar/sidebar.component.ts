import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { Notification } from '../interfaces/user-panel.interfaces';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class SidebarComponent {
  @Input() user: UserRead | null = null;
  @Output() logout = new EventEmitter<void>();

  notifications: Notification[] = [
    {
      id: '1',
      message: 'Recordatorio: Tienes una cita de Cardiología mañana a las 09:30',
      type: 'info',
      read: false,
      createdAt: new Date(2025, 3, 14),
    },
    {
      id: '2',
      message: 'Tu resultado de análisis de sangre está disponible',
      type: 'success',
      read: false,
      createdAt: new Date(2025, 3, 12),
    },
    {
      id: '3',
      message: 'Se ha cancelado tu cita de Dermatología del 05/04/2025',
      type: 'warning',
      read: true,
      createdAt: new Date(2025, 3, 2),
    },
  ];

  menuItems = [
    { label: 'Turnos Agendados', route: '/user_panel/appointments', icon: 'calendar' },
    { label: 'Historial', route: '/user_panel/history', icon: 'history' },
    { label: 'Notificaciones', route: '/user_panel/notifications', icon: 'bell', badge: () => this.getUnreadNotificationsCount() },
    { label: 'Documentos', route: '/user_panel/documents', icon: 'file' },
    { label: 'Perfil', route: '/user_panel/profile', icon: 'user' },
  ];

  get fullName(): string {
    if (!this.user) return 'No disponible';
    return `${this.user.first_name} ${this.user.last_name}`.trim() || 'No disponible';
  }

  getInitials(name: string): string {
    if (!name || name === 'No disponible') return 'ND';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  onLogout(): void {
    this.logout.emit();
  }
}