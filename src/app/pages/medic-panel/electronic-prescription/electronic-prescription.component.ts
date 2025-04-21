import { Component, Input, type OnChanges, type SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';

interface Medication {
  id: string
  name: string
  presentation: string
}

@Component({
  selector: "app-electronic-prescription",
  templateUrl: "./electronic-prescription.component.html",
  styleUrls: ["./electronic-prescription.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ElectronicPrescriptionComponent implements OnChanges {
  @Input() patientId: string | null = null

  prescriptionForm: FormGroup
  medications: Medication[] = []
  isLoading = false
  isSubmitting = false

  constructor(private fb: FormBuilder) {
    this.prescriptionForm = this.createForm()
    this.loadMedications()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["patientId"] && changes["patientId"].currentValue) {
      this.resetForm()
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      diagnosis: ["", Validators.required],
      medications: this.fb.array([]),
      instructions: [""],
      duration: [7, [Validators.required, Validators.min(1)]],
      durationUnit: ["días"],
    })
  }

  resetForm(): void {
    this.prescriptionForm = this.createForm()
    this.medicationsArray.clear()
    this.addMedication()
  }

  get medicationsArray(): FormArray {
    return this.prescriptionForm.get("medications") as FormArray
  }

  createMedicationGroup(): FormGroup {
    return this.fb.group({
      medicationId: ["", Validators.required],
      dosage: ["", Validators.required],
      frequency: ["", Validators.required],
      route: ["oral", Validators.required],
    })
  }

  addMedication(): void {
    this.medicationsArray.push(this.createMedicationGroup())
  }

  removeMedication(index: number): void {
    this.medicationsArray.removeAt(index)
  }

  loadMedications(): void {
    // Simulate API call
    setTimeout(() => {
      this.medications = [
        { id: "med-1", name: "Paracetamol", presentation: "500mg tabletas" },
        { id: "med-2", name: "Ibuprofeno", presentation: "400mg tabletas" },
        { id: "med-3", name: "Amoxicilina", presentation: "500mg cápsulas" },
        { id: "med-4", name: "Loratadina", presentation: "10mg tabletas" },
        { id: "med-5", name: "Omeprazol", presentation: "20mg cápsulas" },
      ]
    }, 500)
  }

  getMedicationName(medicationId: string): string {
    const medication = this.medications.find((m) => m.id === medicationId)
    return medication ? `${medication.name} (${medication.presentation})` : ""
  }

  onSubmit(): void {
    if (this.prescriptionForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.markFormGroupTouched(this.prescriptionForm)
      return
    }

    this.isSubmitting = true

    // Simulate API call
    setTimeout(() => {
      console.log("Prescription submitted:", this.prescriptionForm.value)
      this.isSubmitting = false
      this.resetForm()
      // Here would be success message or redirect
    }, 1000)
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else if (control instanceof FormArray) {
        control.controls.forEach((c) => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c)
          } else {
            c.markAsTouched()
          }
        })
      }
    })
  }
}
