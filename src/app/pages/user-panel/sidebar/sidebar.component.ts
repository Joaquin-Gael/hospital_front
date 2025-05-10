import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, Notification } from '../interfaces/user-panel.interfaces';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  @Input() user: User | null = null;
  @Input() activeSection: string = 'appointments';
  @Output() sectionChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  isEditing = false;

  notifications: Notification[] = [
    {
      id: '1',
      message: 'Recordatorio: Tienes una cita de Cardiología mañana a las 09:30',
      type: 'info',
      read: false,
      createdAt: new Date(2025, 3, 14)
    },
    {
      id: '2',
      message: 'Tu resultado de análisis de sangre está disponible',
      type: 'success',
      read: false,
      createdAt: new Date(2025, 3, 12)
    },
    {
      id: '3',
      message: 'Se ha cancelado tu cita de Dermatología del 05/04/2025',
      type: 'warning',
      read: true,
      createdAt: new Date(2025, 3, 2)
    }
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

  setActiveSection(section: string): void {
    this.sectionChange.emit(section);
  }

  onLogout(): void {
    this.logout.emit();
  }
}