import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  time: string
  duration: number // in minutes
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show"
  reason: string
  isUrgent: boolean
}

@Component({
  selector: "app-appointment-schedule",
  templateUrl: "./appointment-schedule.component.html",
  styleUrls: ["./appointment-schedule.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AppointmentScheduleComponent implements OnInit {
  appointments: Appointment[] = []
  filteredAppointments: Appointment[] = []
  selectedDate: Date = new Date()
  isLoading = true
  statusFilter = "all"

  constructor() {}

  ngOnInit(): void {
    this.loadAppointments()
  }

  loadAppointments(): void {
    // Simulate API call
    setTimeout(() => {
      this.appointments = [
        {
          id: "app-1",
          patientId: "pat-101",
          patientName: "Carlos Rodríguez",
          time: "09:00",
          duration: 30,
          status: "completed",
          reason: "Control anual",
          isUrgent: false,
        },
        {
          id: "app-2",
          patientId: "pat-102",
          patientName: "María López",
          time: "10:00",
          duration: 30,
          status: "in-progress",
          reason: "Dolor en el pecho",
          isUrgent: true,
        },
        {
          id: "app-3",
          patientId: "pat-103",
          patientName: "Juan Pérez",
          time: "11:00",
          duration: 45,
          status: "scheduled",
          reason: "Revisión post-operatoria",
          isUrgent: false,
        },
        {
          id: "app-4",
          patientId: "pat-104",
          patientName: "Laura Gómez",
          time: "12:00",
          duration: 30,
          status: "scheduled",
          reason: "Consulta inicial",
          isUrgent: false,
        },
      ]
      this.applyFilters()
      this.isLoading = false
    }, 1000)
  }

  applyFilters(): void {
    this.filteredAppointments = this.appointments.filter((appointment) => {
      if (this.statusFilter === "all") {
        return true
      }
      return appointment.status === this.statusFilter
    })

    // Sort by time
    this.filteredAppointments.sort((a, b) => {
      return a.time.localeCompare(b.time)
    })
  }

  changeDate(offset: number): void {
    const newDate = new Date(this.selectedDate)
    newDate.setDate(newDate.getDate() + offset)
    this.selectedDate = newDate
    this.loadAppointments()
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  updateAppointmentStatus(
    appointmentId: string,
    newStatus: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show",
  ): void {
    const appointment = this.appointments.find((a) => a.id === appointmentId)
    if (appointment) {
      appointment.status = newStatus
      // Here would be the API call to update status
      this.applyFilters()
    }
  }

  selectPatient(patientId: string): void {
    // This would communicate with the parent component to show patient details
    console.log("Selected patient:", patientId)
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      scheduled: "Programada",
      "in-progress": "En curso",
      completed: "Completada",
      cancelled: "Cancelada",
      "no-show": "No asistió",
    }
    return statusMap[status] || status
  }
}
