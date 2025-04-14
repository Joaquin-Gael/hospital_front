import { Component, Input, type OnChanges, type SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface StudyType {
  id: string
  name: string
  category: string
}

@Component({
  selector: "app-study-request",
  templateUrl: "./study-request.component.html",
  styleUrls: ["./study-request.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class StudyRequestComponent implements OnChanges {
  @Input() patientId: string | null = null

  studyForm: FormGroup
  studyTypes: StudyType[] = []
  filteredStudyTypes: StudyType[] = []
  isLoading = false
  isSubmitting = false
  selectedCategory = "all"

  constructor(private fb: FormBuilder) {
    this.studyForm = this.createForm()
    this.loadStudyTypes()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["patientId"] && changes["patientId"].currentValue) {
      this.resetForm()
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      studyTypeId: ["", Validators.required],
      clinicalQuestion: ["", Validators.required],
      urgency: ["normal"],
      notes: [""],
      scheduledDate: [null],
    })
  }

  resetForm(): void {
    this.studyForm = this.createForm()
  }

  loadStudyTypes(): void {
    // Simulate API call
    setTimeout(() => {
      this.studyTypes = [
        { id: "study-1", name: "Hemograma completo", category: "laboratorio" },
        { id: "study-2", name: "Perfil lipídico", category: "laboratorio" },
        { id: "study-3", name: "Glucemia", category: "laboratorio" },
        { id: "study-4", name: "Radiografía de tórax", category: "imagenes" },
        { id: "study-5", name: "Ecografía abdominal", category: "imagenes" },
        { id: "study-6", name: "Electrocardiograma", category: "cardiologia" },
        { id: "study-7", name: "Ecocardiograma", category: "cardiologia" },
        { id: "study-8", name: "Interconsulta Neurología", category: "interconsulta" },
        { id: "study-9", name: "Interconsulta Cardiología", category: "interconsulta" },
      ]

      this.applyFilters()
    }, 500)
  }

  applyFilters(): void {
    this.filteredStudyTypes = this.studyTypes.filter((study) => {
      if (this.selectedCategory === "all") {
        return true
      }
      return study.category === this.selectedCategory
    })
  }

  getCategoryLabel(category: string): string {
    const categoryMap: { [key: string]: string } = {
      laboratorio: "Laboratorio",
      imagenes: "Imágenes",
      cardiologia: "Cardiología",
      interconsulta: "Interconsulta",
    }
    return categoryMap[category] || category
  }

  onSubmit(): void {
    if (this.studyForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.studyForm.controls).forEach((key) => {
        const control = this.studyForm.get(key)
        control?.markAsTouched()
      })
      return
    }

    this.isSubmitting = true

    // Simulate API call
    setTimeout(() => {
      console.log("Study request submitted:", this.studyForm.value)
      this.isSubmitting = false
      this.resetForm()
      // Here would be success message or redirect
    }, 1000)
  }
}
