import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  timestamp: Date
  isRead: boolean
}

@Component({
  selector: "app-notification-panel",
  templateUrl: "./notification-panel.component.html",
  styleUrls: ["./notification-panel.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class NotificationPanelComponent implements OnInit {
  notifications: Notification[] = []
  unreadCount = 0
  isExpanded = false

  constructor() {}

  ngOnInit(): void {
    this.loadNotifications()
  }

  loadNotifications(): void {
    // Simulate API call
    setTimeout(() => {
      this.notifications = [
        {
          id: "notif-1",
          title: "Nuevo resultado de laboratorio",
          message: "Resultados de análisis de sangre disponibles para el paciente María López.",
          type: "info",
          timestamp: new Date(new Date().getTime() - 30 * 60000), // 30 minutes ago
          isRead: false,
        },
        {
          id: "notif-2",
          title: "Cita cancelada",
          message: "El paciente Juan Pérez ha cancelado su cita de mañana a las 10:00.",
          type: "warning",
          timestamp: new Date(new Date().getTime() - 2 * 60 * 60000), // 2 hours ago
          isRead: false,
        },
        {
          id: "notif-3",
          title: "Recordatorio de reunión",
          message: "Reunión de personal médico hoy a las 14:00 en la sala de conferencias.",
          type: "info",
          timestamp: new Date(new Date().getTime() - 5 * 60 * 60000), // 5 hours ago
          isRead: true,
        },
        {
          id: "notif-4",
          title: "Actualización de protocolo",
          message: "Se ha actualizado el protocolo de tratamiento para pacientes con hipertensión.",
          type: "success",
          timestamp: new Date(new Date().getTime() - 24 * 60 * 60000), // 1 day ago
          isRead: true,
        },
      ]

      this.updateUnreadCount()
    }, 1000)
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter((n) => !n.isRead).length
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification && !notification.isRead) {
      notification.isRead = true
      // Here would be the API call to update status
      this.updateUnreadCount()
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((notification) => {
      notification.isRead = true
    })
    // Here would be the API call to update status
    this.updateUnreadCount()
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId)
    // Here would be the API call to delete notification
    this.updateUnreadCount()
  }

  formatTimestamp(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`
    } else if (diffMins < 24 * 60) {
      const diffHours = Math.floor(diffMins / 60)
      return `Hace ${diffHours} horas`
    } else {
      const diffDays = Math.floor(diffMins / (24 * 60))
      return `Hace ${diffDays} días`
    }
  }
}
