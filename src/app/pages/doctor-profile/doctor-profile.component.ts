import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"

interface Doctor {
  id: string
  name: string
  specialty: string
  licenseNumber: string
  status: "available" | "busy" | "offline"
  avatarUrl: string
}

@Component({
  selector: "app-doctor-profile",
  templateUrl: "./doctor-profile.component.html",
  styleUrls: ["./doctor-profile.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class DoctorProfileComponent implements OnInit {
  doctor: Doctor | null = null
  isLoading = true

  constructor() {}

  ngOnInit(): void {
    // Simulate API call
    setTimeout(() => {
      this.doctor = {
        id: "doc-123",
        name: "Dr. Ana Martínez",
        specialty: "Cardiología",
        licenseNumber: "MN-45678",
        status: "available",
        avatarUrl: "assets/images/doctor-avatar.jpg",
      }
      this.isLoading = false
    }, 800)
  }

  getStatusLabel(status: "available" | "busy" | "offline"): string {
    const statusMap = {
      available: "Disponible",
      busy: "En consulta",
      offline: "Fuera de servicio",
    }
    return statusMap[status]
  }

  updateStatus(newStatus: "available" | "busy" | "offline"): void {
    if (this.doctor) {
      this.doctor.status = newStatus
      // Here would be the API call to update status
    }
  }
}
