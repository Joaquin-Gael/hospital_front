import { Component, Input, type OnChanges, type SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"

interface Patient {
  id: string
  name: string
  age: number
  gender: "male" | "female" | "other"
  bloodType: string
  allergies: string[]
  chronicConditions: string[]
  contactPhone: string
  contactEmail: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  insuranceProvider: string
  insuranceNumber: string
}

@Component({
  selector: "app-patient-detail",
  templateUrl: "./patient-detail.component.html",
  styleUrls: ["./patient-detail.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class PatientDetailComponent implements OnChanges {
  @Input() patientId: string | null = null
  patient: Patient | null = null
  isLoading = false

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["patientId"] && changes["patientId"].currentValue) {
      this.loadPatientData()
    }
  }

  loadPatientData(): void {
    if (!this.patientId) return

    this.isLoading = true

    // Simulate API call
    setTimeout(() => {
      this.patient = {
        id: this.patientId as string,
        name: "María López",
        age: 42,
        gender: "female",
        bloodType: "O+",
        allergies: ["Penicilina", "Sulfas"],
        chronicConditions: ["Hipertensión", "Diabetes tipo 2"],
        contactPhone: "+34 612 345 678",
        contactEmail: "maria.lopez@email.com",
        emergencyContact: {
          name: "Juan López",
          relationship: "Esposo",
          phone: "+34 698 765 432",
        },
        insuranceProvider: "Sanitas",
        insuranceNumber: "SAN-123456789",
      }
      this.isLoading = false
    }, 800)
  }

  formatAllergies(allergies: string[]): string {
    if (!allergies || allergies.length === 0) {
      return "Ninguna conocida"
    }
    return allergies.join(", ")
  }

  formatChronicConditions(conditions: string[]): string {
    if (!conditions || conditions.length === 0) {
      return "Ninguna conocida"
    }
    return conditions.join(", ")
  }
}
