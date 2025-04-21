import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { PanelUiComponent } from "../panel-ui/panel-ui.component"

interface Patient {
  id: string
  name: string
  age: number
  gender: "male" | "female" | "other"
  bloodType: string
  contactPhone: string
  contactEmail: string
  lastVisit: Date | null
  nextAppointment: Date | null
  insuranceProvider: string
  status: "active" | "inactive" | "pending"
}

@Component({
  selector: "app-patients",
  templateUrl: "./patients.component.html",
  styleUrls: ["./patients.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = []
  filteredPatients: Patient[] = []
  isLoading = true
  searchTerm = ""
  statusFilter = "all"
  sortBy = "name"
  sortOrder: "asc" | "desc" = "asc"
  selectedPatient: Patient | null = null

  constructor() {}

  ngOnInit(): void {
    this.loadPatients()
  }

  loadPatients(): void {
    // Simulate API call
    setTimeout(() => {
      this.patients = [
        {
          id: "pat-001",
          name: "María López",
          age: 42,
          gender: "female",
          bloodType: "O+",
          contactPhone: "+34 612 345 678",
          contactEmail: "maria.lopez@email.com",
          lastVisit: new Date(2023, 4, 15),
          nextAppointment: new Date(2023, 6, 10),
          insuranceProvider: "Sanitas",
          status: "active",
        },
        {
          id: "pat-002",
          name: "Carlos Rodríguez",
          age: 35,
          gender: "male",
          bloodType: "A+",
          contactPhone: "+34 623 456 789",
          contactEmail: "carlos.rodriguez@email.com",
          lastVisit: new Date(2023, 3, 20),
          nextAppointment: null,
          insuranceProvider: "Adeslas",
          status: "active",
        },
        {
          id: "pat-003",
          name: "Ana Martínez",
          age: 28,
          gender: "female",
          bloodType: "B-",
          contactPhone: "+34 634 567 890",
          contactEmail: "ana.martinez@email.com",
          lastVisit: null,
          nextAppointment: new Date(2023, 5, 5),
          insuranceProvider: "Mapfre",
          status: "pending",
        },
        {
          id: "pat-004",
          name: "Juan Pérez",
          age: 56,
          gender: "male",
          bloodType: "AB+",
          contactPhone: "+34 645 678 901",
          contactEmail: "juan.perez@email.com",
          lastVisit: new Date(2023, 2, 10),
          nextAppointment: null,
          insuranceProvider: "DKV",
          status: "inactive",
        },
        {
          id: "pat-005",
          name: "Laura Gómez",
          age: 31,
          gender: "female",
          bloodType: "O-",
          contactPhone: "+34 656 789 012",
          contactEmail: "laura.gomez@email.com",
          lastVisit: new Date(2023, 4, 25),
          nextAppointment: new Date(2023, 6, 15),
          insuranceProvider: "Asisa",
          status: "active",
        },
      ]

      this.applyFilters()
      this.isLoading = false
    }, 1000)
  }

  applyFilters(): void {
    // Filter by search term and status
    this.filteredPatients = this.patients.filter((patient) => {
      // Status filter
      if (this.statusFilter !== "all" && patient.status !== this.statusFilter) {
        return false
      }

      // Search term filter
      if (this.searchTerm.trim() !== "") {
        const searchLower = this.searchTerm.toLowerCase()
        return (
          patient.name.toLowerCase().includes(searchLower) ||
          patient.contactEmail.toLowerCase().includes(searchLower) ||
          patient.contactPhone.includes(searchLower) ||
          patient.insuranceProvider.toLowerCase().includes(searchLower)
        )
      }

      return true
    })

    // Apply sorting
    this.sortPatients()
  }

  sortPatients(): void {
    this.filteredPatients.sort((a, b) => {
      let comparison = 0

      switch (this.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "age":
          comparison = a.age - b.age
          break
        case "lastVisit":
          // Handle null dates
          if (!a.lastVisit && !b.lastVisit) comparison = 0
          else if (!a.lastVisit) comparison = 1
          else if (!b.lastVisit) comparison = -1
          else comparison = a.lastVisit.getTime() - b.lastVisit.getTime()
          break
        case "nextAppointment":
          // Handle null dates
          if (!a.nextAppointment && !b.nextAppointment) comparison = 0
          else if (!a.nextAppointment) comparison = 1
          else if (!b.nextAppointment) comparison = -1
          else comparison = a.nextAppointment.getTime() - b.nextAppointment.getTime()
          break
        default:
          comparison = 0
      }

      return this.sortOrder === "asc" ? comparison : -comparison
    })
  }

  onSearch(): void {
    this.applyFilters()
  }

  onStatusFilterChange(): void {
    this.applyFilters()
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      // Toggle sort order if clicking the same column
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc"
    } else {
      // Set new sort column and default to ascending
      this.sortBy = column
      this.sortOrder = "asc"
    }

    this.sortPatients()
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient
  }

  formatDate(date: Date | null): string {
    if (!date) return "No programada"

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: "Activo",
      inactive: "Inactivo",
      pending: "Pendiente",
    }
    return statusMap[status] || status
  }

  getGenderLabel(gender: string): string {
    const genderMap: { [key: string]: string } = {
      male: "Masculino",
      female: "Femenino",
      other: "Otro",
    }
    return genderMap[gender] || gender
  }
}
