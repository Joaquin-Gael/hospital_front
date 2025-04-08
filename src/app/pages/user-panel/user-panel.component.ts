import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

interface Appointment {
  id: string
  date: Date
  time: string
  specialty: string
  doctor: string
  location: string
  status: "scheduled" | "completed" | "cancelled"
}

interface Notification {
  id: string
  message: string
  date: Date
  read: boolean
  type: "reminder" | "change" | "info"
}

interface Document {
  id: string
  name: string
  type: string
  date: Date
  downloadUrl: string
}

@Component({
  selector: "app-user-panel",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./user-panel.component.html",
  styleUrls: ["./user-panel.component.scss"],
})
export class UserPanelComponent {
  activeTab = "appointments"

  // Datos de ejemplo para el usuario
  user = {
    name: "Ana María Rodríguez",
    id: "28.456.789",
    birthDate: new Date(1985, 5, 15),
    phone: "(011) 15-5555-4321",
    email: "ana.rodriguez@email.com",
    address: "Av. Corrientes 1234, CABA",
    bloodType: "O+",
    insurance: "OSDE 310",
    lastVisit: new Date(2025, 2, 10),
  }

  // Turnos agendados (datos de ejemplo)
  upcomingAppointments: Appointment[] = [
    {
      id: "AP-2023-001",
      date: new Date(2025, 3, 15),
      time: "09:30",
      specialty: "Cardiología",
      doctor: "Dr. Martín Gutiérrez",
      location: "Consultorio 305, 3er piso",
      status: "scheduled",
    },
    {
      id: "AP-2023-002",
      date: new Date(2025, 3, 22),
      time: "14:15",
      specialty: "Análisis Clínicos",
      doctor: "Dra. Laura Sánchez",
      location: "Laboratorio, Planta Baja",
      status: "scheduled",
    },
  ]

  // Historial de turnos (datos de ejemplo)
  pastAppointments: Appointment[] = [
    {
      id: "AP-2023-003",
      date: new Date(2025, 2, 10),
      time: "11:00",
      specialty: "Medicina General",
      doctor: "Dr. Carlos Méndez",
      location: "Consultorio 102, 1er piso",
      status: "completed",
    },
    {
      id: "AP-2023-004",
      date: new Date(2025, 1, 5),
      time: "16:30",
      specialty: "Dermatología",
      doctor: "Dra. Sofía Peralta",
      location: "Consultorio 207, 2do piso",
      status: "completed",
    },
    {
      id: "AP-2023-005",
      date: new Date(2024, 11, 20),
      time: "10:45",
      specialty: "Oftalmología",
      doctor: "Dr. Roberto Álvarez",
      location: "Consultorio 401, 4to piso",
      status: "cancelled",
    },
  ]

  // Notificaciones (datos de ejemplo)
  notifications: Notification[] = [
    {
      id: "NOT-001",
      message: "Recordatorio: Tiene un turno de Cardiología mañana a las 09:30",
      date: new Date(2025, 3, 14),
      read: false,
      type: "reminder",
    },
    {
      id: "NOT-002",
      message: "Su turno de Análisis Clínicos ha sido confirmado",
      date: new Date(2025, 3, 10),
      read: true,
      type: "info",
    },
    {
      id: "NOT-003",
      message: "El consultorio de su próxima cita ha cambiado a 305, 3er piso",
      date: new Date(2025, 3, 8),
      read: true,
      type: "change",
    },
  ]

  // Documentos (datos de ejemplo)
  documents: Document[] = [
    {
      id: "DOC-001",
      name: "Resultados Análisis de Sangre",
      type: "PDF",
      date: new Date(2025, 2, 12),
      downloadUrl: "#",
    },
    {
      id: "DOC-002",
      name: "Receta Médica - Cardiología",
      type: "PDF",
      date: new Date(2025, 2, 10),
      downloadUrl: "#",
    },
    {
      id: "DOC-003",
      name: "Indicaciones Post-consulta",
      type: "PDF",
      date: new Date(2025, 1, 5),
      downloadUrl: "#",
    },
  ]

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter((notification) => !notification.read).length
  }

  markAsRead(notification: Notification): void {
    notification.read = true
  }

  cancelAppointment(appointment: Appointment): void {
    // Aquí iría la lógica para cancelar un turno
    console.log(`Cancelando turno: ${appointment.id}`)
    // Por ahora solo cambiamos el estado para simular
    appointment.status = "cancelled"
  }

  rescheduleAppointment(appointment: Appointment): void {
    // Aquí iría la lógica para reprogramar un turno
    console.log(`Reprogramando turno: ${appointment.id}`)
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    })
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString("es-AR", { weekday: "short" })
  }
}
