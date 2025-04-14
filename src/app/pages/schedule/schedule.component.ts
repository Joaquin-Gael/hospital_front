import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { PanelUiComponent } from "../panel-ui/panel-ui.component"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  time: string
  duration: number // in minutes
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show"
  reason: string
  isUrgent: boolean
  notes?: string
}

interface CalendarDay {
  date: Date
  appointments: Appointment[]
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
}

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.component.html",
  styleUrls: ["./schedule.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ScheduleComponent implements OnInit {
  currentDate: Date = new Date()
  selectedDate: Date = new Date()
  calendarDays: CalendarDay[] = []
  appointments: Appointment[] = []
  filteredAppointments: Appointment[] = []
  isLoading = true
  statusFilter = "all"
  viewMode: "day" | "week" | "month" = "day"

  constructor() {}

  ngOnInit(): void {
    this.generateCalendarDays()
    this.loadAppointments()
  }

  generateCalendarDays(): void {
    this.calendarDays = []

    // Get the first day of the month
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    // Get the last day of the month
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate the number of days to show from the previous month
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    // Get the last day of the previous month
    const lastDayPrevMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0)

    // Add days from the previous month
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const date = new Date(lastDayPrevMonth)
      date.setDate(lastDayPrevMonth.getDate() - i + 1)

      this.calendarDays.push({
        date,
        appointments: [],
        isToday: this.isToday(date),
        isSelected: this.isSameDay(date, this.selectedDate),
        isCurrentMonth: false,
      })
    }

    // Add days from the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i)

      this.calendarDays.push({
        date,
        appointments: [],
        isToday: this.isToday(date),
        isSelected: this.isSameDay(date, this.selectedDate),
        isCurrentMonth: true,
      })
    }

    // Calculate how many days we need from the next month to complete the grid
    const remainingDays = 42 - this.calendarDays.length // 6 rows of 7 days

    // Add days from the next month
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, i)

      this.calendarDays.push({
        date,
        appointments: [],
        isToday: this.isToday(date),
        isSelected: this.isSameDay(date, this.selectedDate),
        isCurrentMonth: false,
      })
    }
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
          notes: "Paciente con antecedentes de hipertensión",
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
        {
          id: "app-5",
          patientId: "pat-105",
          patientName: "Pedro Sánchez",
          time: "14:30",
          duration: 60,
          status: "scheduled",
          reason: "Evaluación cardiológica",
          isUrgent: false,
        },
        {
          id: "app-6",
          patientId: "pat-106",
          patientName: "Ana Martínez",
          time: "16:00",
          duration: 30,
          status: "scheduled",
          reason: "Seguimiento tratamiento",
          isUrgent: false,
        },
      ]

      // Distribute appointments to calendar days
      this.distributeAppointments()

      this.applyFilters()
      this.isLoading = false
    }, 1000)
  }

  distributeAppointments(): void {
    // Clear existing appointments
    this.calendarDays.forEach((day) => {
      day.appointments = []
    })

    // Distribute appointments to their respective days
    this.appointments.forEach((appointment) => {
      // For demo purposes, we'll add appointments to the selected date and a few random days
      const randomDays = [0, 1, 3, 5, 7, 10, 14]

      randomDays.forEach((offset) => {
        const date = new Date(this.selectedDate)
        date.setDate(date.getDate() + offset)

        // Find the calendar day that matches this date
        const calendarDay = this.calendarDays.find((day) => this.isSameDay(day.date, date))

        if (calendarDay) {
          // Create a copy of the appointment with a different time for variety
          const appointmentCopy = { ...appointment }
          appointmentCopy.id = `${appointment.id}-${offset}`

          // Adjust time based on offset
          const hour = Number.parseInt(appointment.time.split(":")[0])
          const minute = Number.parseInt(appointment.time.split(":")[1])
          const newHour = (hour + offset) % 12 || 12
          appointmentCopy.time = `${newHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

          calendarDay.appointments.push(appointmentCopy)
        }
      })
    })
  }

  applyFilters(): void {
    // Filter appointments for the selected date
    const selectedDay = this.calendarDays.find((day) => this.isSameDay(day.date, this.selectedDate))

    if (selectedDay) {
      this.filteredAppointments = selectedDay.appointments.filter((appointment) => {
        if (this.statusFilter === "all") {
          return true
        }
        return appointment.status === this.statusFilter
      })

      // Sort by time
      this.filteredAppointments.sort((a, b) => {
        return a.time.localeCompare(b.time)
      })
    } else {
      this.filteredAppointments = []
    }
  }

  selectDate(date: Date): void {
    this.selectedDate = date

    // Update selected state in calendar days
    this.calendarDays.forEach((day) => {
      day.isSelected = this.isSameDay(day.date, date)
    })

    this.applyFilters()
  }

  changeMonth(offset: number): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1)
    this.generateCalendarDays()
    this.distributeAppointments()
  }

  changeDate(offset: number): void {
    const newDate = new Date(this.selectedDate)
    newDate.setDate(newDate.getDate() + offset)
    this.selectDate(newDate)
  }

  goToToday(): void {
    const today = new Date()
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1)
    this.generateCalendarDays()
    this.distributeAppointments()
    this.selectDate(today)
  }

  changeViewMode(mode: "day" | "week" | "month"): void {
    this.viewMode = mode
  }

  updateAppointmentStatus(
    appointmentId: string,
    newStatus: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show",
  ): void {
    // Find and update the appointment in all days
    this.calendarDays.forEach((day) => {
      const appointment = day.appointments.find((a) => a.id === appointmentId)
      if (appointment) {
        appointment.status = newStatus
      }
    })

    // Update the appointment in the main list
    const appointment = this.appointments.find((a) => a.id === appointmentId)
    if (appointment) {
      appointment.status = newStatus
    }

    // Refresh filtered appointments
    this.applyFilters()
  }

  formatMonthYear(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    })
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
    })
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

  getAppointmentCountForDay(day: CalendarDay): number {
    return day.appointments.length
  }

  private isToday(date: Date): boolean {
    const today = new Date()
    return this.isSameDay(date, today)
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }
}
