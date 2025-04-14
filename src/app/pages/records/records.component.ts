import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"

interface PatientRecord {
  id: string
  patientName: string
  patientId: string
  date: string
  recordType: string
  doctor: string
  status: string
}

@Component({
  selector: "app-records",
  templateUrl: "./records.component.html",
  styleUrls: ["./records.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class RecordsComponent implements OnInit {
  records: PatientRecord[] = []
  filteredRecords: PatientRecord[] = []
  searchTerm = ""
  selectedFilter = "all"

  constructor() {}

  ngOnInit(): void {
    // Simular carga de registros médicos
    this.loadRecords()
    this.filteredRecords = [...this.records]
  }

  loadRecords(): void {
    this.records = [
      {
        id: "rec1",
        patientName: "Carlos Rodríguez",
        patientId: "P12345",
        date: "2023-04-15",
        recordType: "Consulta General",
        doctor: "Dra. Ana Martínez",
        status: "Completado",
      },
      {
        id: "rec2",
        patientName: "María López",
        patientId: "P12346",
        date: "2023-04-14",
        recordType: "Análisis de Sangre",
        doctor: "Dr. Juan Pérez",
        status: "Pendiente",
      },
      {
        id: "rec3",
        patientName: "José García",
        patientId: "P12347",
        date: "2023-04-13",
        recordType: "Radiografía",
        doctor: "Dra. Ana Martínez",
        status: "Completado",
      },
      {
        id: "rec4",
        patientName: "Laura Fernández",
        patientId: "P12348",
        date: "2023-04-12",
        recordType: "Consulta Especialista",
        doctor: "Dr. Roberto Sánchez",
        status: "En proceso",
      },
      {
        id: "rec5",
        patientName: "Pedro Martínez",
        patientId: "P12349",
        date: "2023-04-11",
        recordType: "Ecografía",
        doctor: "Dra. Ana Martínez",
        status: "Completado",
      },
    ]
  }

  searchRecords(event: Event): void {
    const target = event.target as HTMLInputElement
    this.searchTerm = target.value.toLowerCase()
    this.applyFilters()
  }

  filterByStatus(status: string): void {
    this.selectedFilter = status
    this.applyFilters()
  }

  applyFilters(): void {
    this.filteredRecords = this.records.filter((record) => {
      // Aplicar filtro de búsqueda
      const matchesSearch =
        record.patientName.toLowerCase().includes(this.searchTerm) ||
        record.patientId.toLowerCase().includes(this.searchTerm) ||
        record.recordType.toLowerCase().includes(this.searchTerm)

      // Aplicar filtro de estado
      const matchesStatus =
        this.selectedFilter === "all" || record.status.toLowerCase() === this.selectedFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }

  viewRecordDetails(recordId: string): void {
    console.log(`Ver detalles del registro: ${recordId}`)
    // Implementar lógica para mostrar detalles
  }
}
