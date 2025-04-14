import { Component, Input, type OnChanges, type SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"

interface HistoryEntry {
  id: string
  date: Date
  type: "consultation" | "procedure" | "diagnosis" | "medication" | "lab" | "imaging"
  title: string
  description: string
  doctor: string
  attachments?: {
    name: string
    url: string
    type: string
  }[]
}

@Component({
  selector: "app-medical-history",
  templateUrl: "./medical-history.component.html",
  styleUrls: ["./medical-history.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class MedicalHistoryComponent implements OnChanges {
  @Input() patientId: string | null = null

  historyEntries: HistoryEntry[] = []
  filteredEntries: HistoryEntry[] = []
  isLoading = false
  typeFilter = "all"
  searchTerm = ""

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["patientId"] && changes["patientId"].currentValue) {
      this.loadMedicalHistory()
    }
  }

  loadMedicalHistory(): void {
    if (!this.patientId) return

    this.isLoading = true

    // Simulate API call
    setTimeout(() => {
      this.historyEntries = [
        {
          id: "entry-1",
          date: new Date(2023, 4, 15),
          type: "consultation",
          title: "Consulta inicial",
          description: "Paciente acude por dolor en el pecho. Se realiza ECG que muestra ritmo sinusal normal.",
          doctor: "Dr. Ana Martínez",
        },
        {
          id: "entry-2",
          date: new Date(2023, 4, 20),
          type: "lab",
          title: "Análisis de sangre",
          description: "Hemograma completo y perfil lipídico. Colesterol elevado (240 mg/dL).",
          doctor: "Dr. Juan Pérez",
          attachments: [
            {
              name: "Resultados laboratorio.pdf",
              url: "/assets/documents/lab-results.pdf",
              type: "pdf",
            },
          ],
        },
        {
          id: "entry-3",
          date: new Date(2023, 5, 5),
          type: "diagnosis",
          title: "Diagnóstico: Hipertensión",
          description:
            "Se diagnostica hipertensión arterial grado 1. Se recomienda cambios en el estilo de vida y seguimiento.",
          doctor: "Dr. Ana Martínez",
        },
        {
          id: "entry-4",
          date: new Date(2023, 5, 5),
          type: "medication",
          title: "Prescripción: Enalapril",
          description: "Enalapril 10mg, 1 comprimido cada 24 horas por 30 días.",
          doctor: "Dr. Ana Martínez",
        },
        {
          id: "entry-5",
          date: new Date(2023, 6, 10),
          type: "consultation",
          title: "Seguimiento",
          description: "Paciente refiere mejoría. Presión arterial controlada (130/85 mmHg).",
          doctor: "Dr. Ana Martínez",
        },
        {
          id: "entry-6",
          date: new Date(2023, 7, 15),
          type: "imaging",
          title: "Ecocardiograma",
          description: "Función ventricular conservada. No se observan alteraciones estructurales significativas.",
          doctor: "Dr. Carlos Rodríguez",
          attachments: [
            {
              name: "Ecocardiograma.jpg",
              url: "/assets/images/echo.jpg",
              type: "image",
            },
            {
              name: "Informe ecocardiograma.pdf",
              url: "/assets/documents/echo-report.pdf",
              type: "pdf",
            },
          ],
        },
      ]

      this.applyFilters()
      this.isLoading = false
    }, 1200)
  }

  applyFilters(): void {
    this.filteredEntries = this.historyEntries.filter((entry) => {
      // Apply type filter
      if (this.typeFilter !== "all" && entry.type !== this.typeFilter) {
        return false
      }

      // Apply search filter
      if (this.searchTerm.trim() !== "") {
        const searchLower = this.searchTerm.toLowerCase()
        return (
          entry.title.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.doctor.toLowerCase().includes(searchLower)
        )
      }

      return true
    })

    // Sort by date (newest first)
    this.filteredEntries.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      consultation: "Consulta",
      procedure: "Procedimiento",
      diagnosis: "Diagnóstico",
      medication: "Medicación",
      lab: "Laboratorio",
      imaging: "Imágenes",
    }
    return typeMap[type] || type
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      consultation: "icon-user-check",
      procedure: "icon-activity",
      diagnosis: "icon-clipboard",
      medication: "icon-pill",
      lab: "icon-flask",
      imaging: "icon-image",
    }
    return iconMap[type] || "icon-file-text"
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement
    this.searchTerm = input.value
    this.applyFilters()
  }
}
