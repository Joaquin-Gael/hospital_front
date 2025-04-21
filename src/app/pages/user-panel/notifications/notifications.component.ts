import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../models/models';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class NotificationsComponent {
  @Input() notifications: Notification[] = [];
  @Output() markAsRead = new EventEmitter<string>();

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onMarkAsRead(notification: Notification): void {
    this.markAsRead.emit(notification.id);
  }
}