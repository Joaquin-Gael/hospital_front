import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../interfaces/user-panel.interfaces';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class NotificationsComponent implements OnInit {
  @Input() notifications: Notification[] = [];
  @Output() markAsRead = new EventEmitter<string>();

  ngOnInit() {
    if (this.notifications.length === 0) {
      this.notifications = [
        {
          id: '1',
          message: 'Tu contraseña fue cambiada exitosamente.',
          type: 'success',
          read: false,
          createdAt: new Date('2025-01-12T10:24:00')
        },
        {
          id: '2',
          message: 'Se detectó un inicio de sesión inusual.',
          type: 'warning',
          read: false,
          createdAt: new Date('2025-01-11T18:05:00')
        },
        {
          id: '3',
          message: 'Nueva funcionalidad disponible en tu panel.',
          type: 'info',
          read: true,
          createdAt: new Date('2025-01-10T09:15:00')
        }
      ];
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  onMarkAsRead(notification: Notification): void {
    this.markAsRead.emit(notification.id);
  }
}
