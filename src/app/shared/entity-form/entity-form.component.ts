import {
  Component,
  EventEmitter,
  Input,
  type OnInit,
  Output,
  ChangeDetectionStrategy,
  type OnChanges,
  type SimpleChanges,
   ChangeDetectorRef,
  type ElementRef,
  ViewChildren,
  type QueryList,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder,  FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"

export interface FormField {
  key: string
  label: string
  type: "text" | "number" | "email" | "password" | "textarea" | "select" | "checkbox" | "date" | "file"
  required?: boolean
  options?: { value: any; label: string }[]
  validators?: any[]
  defaultValue?: any
  readonly?: boolean
}

@Component({
  selector: "app-entity-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() fields: FormField[] = []
  @Input() initialData: any = null
  @Input() mode: "create" | "edit" = "create"
  @Input() title = "Formulario"
  @Input() submitLabel = "Guardar"
  @Input() loading = false
  @Input() enableImageUpload = false
  @Output() formSubmit = new EventEmitter<any>()
  @Output() formCancel = new EventEmitter<void>()
  @Output() imageSelected = new EventEmitter<File>()
  @Output() filesSelected = new EventEmitter<{ [key: string]: File }>()

  @ViewChildren("fileInput") fileInputs!: QueryList<ElementRef<HTMLInputElement>>

  form!: FormGroup
  selectedImage: File | null = null

  selectedFiles: { [key: string]: File } = {}
  isDragOver: { [key: string]: boolean } = {}
  uploadProgress: { [key: string]: number } = {}
  private dragCounter: { [key: string]: number } = {}

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["initialData"] &&
      !changes["initialData"].firstChange &&
      !this.isEqual(changes["initialData"].previousValue, changes["initialData"].currentValue)
    ) {
      this.initForm()
      this.cdr.markForCheck()
    }
  }

  private isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    if (!obj1 || !obj2) return false
    return JSON.stringify(obj1) === JSON.stringify(obj2)
  }

  hasFileFields(): boolean {
    return this.fields.some(field => field.type === 'file')
  }

  /** Método que loggea el foco en un campo */
  logFocus(fieldKey: string): void {
    const control = this.form.get(fieldKey)
    console.log(`Focus en ${fieldKey}`, "valor:", control?.value, "válido:", control?.valid)
  }

  private initForm(): void {
    const formControls: Record<string, any> = {}
    const data = this.initialData ? { ...this.initialData } : {}

    this.fields.forEach((field) => {
      const validators = (field.required ?? false) ? [Validators.required] : []
      if (field.validators) {
        validators.push(...field.validators)
      }

      let value = data[field.key] ?? field.defaultValue ?? ""
      if (field.type === "select" && (value === "" || value === null) && field.options?.length) {
        value = field.options[0].value
      }

      formControls[field.key] = [value, validators]
    })

    if (this.form) {
      Object.keys(formControls).forEach((key) => {
        const control = this.form.get(key)
        if (control) {
          control.setValue(formControls[key][0], { emitEvent: false })
          control.setValidators(formControls[key][1])
          control.updateValueAndValidity({ emitEvent: false })
        }
      })
    } else {
      this.form = this.fb.group(formControls)
    }

    console.log("Formulario inicializado con valores:", this.form.value)
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form)
      return
    }
    const formValue = this.form.value

    if (this.selectedImage) {
      this.imageSelected.emit(this.selectedImage)
    }

    if (Object.keys(this.selectedFiles).length > 0) {
      this.filesSelected.emit(this.selectedFiles)
    }

    this.formSubmit.emit(formValue)
  }

  onCancel(): void {
    this.formCancel.emit()
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0]
      this.imageSelected.emit(this.selectedImage)
    }
  }

  onDragOver(event: DragEvent, fieldKey: string): void {
    event.preventDefault()
    event.stopPropagation()

    if (!this.isDragOver[fieldKey]) {
      this.isDragOver[fieldKey] = true
      this.dragCounter[fieldKey] = 0
      this.cdr.markForCheck()
    }
    this.dragCounter[fieldKey]++
  }

  onDragLeave(event: DragEvent, fieldKey: string): void {
    event.preventDefault()
    event.stopPropagation()

    this.dragCounter[fieldKey]--
    if (this.dragCounter[fieldKey] === 0) {
      this.isDragOver[fieldKey] = false
      this.cdr.markForCheck()
    }
  }

  onDrop(event: DragEvent, fieldKey: string): void {
    event.preventDefault()
    event.stopPropagation()

    this.isDragOver[fieldKey] = false
    this.dragCounter[fieldKey] = 0

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]

      // Validar que sea una imagen
      if (file.type.startsWith("image/")) {
        this.handleFileSelection(file, fieldKey)
      } else {
        console.warn("Solo se permiten archivos de imagen")
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    }

    this.cdr.markForCheck()
  }

  onFileSelected(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const file = input.files[0]
      this.handleFileSelection(file, fieldKey)
    }
  }

  private handleFileSelection(file: File, fieldKey: string): void {
    // Validaciones adicionales
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.warn("El archivo es demasiado grande. Máximo 5MB.")
      return
    }

    // Guardar el archivo
    this.selectedFiles[fieldKey] = file

    // Para compatibilidad con el método anterior
    if (fieldKey === "image" || Object.keys(this.selectedFiles).length === 1) {
      this.selectedImage = file
      this.imageSelected.emit(file)
    }

    // Simular progreso de carga (opcional)
    this.simulateUploadProgress(fieldKey)

    console.log(`Archivo seleccionado para ${fieldKey}:`, file.name, file.size)
    this.cdr.markForCheck()
  }

  private simulateUploadProgress(fieldKey: string): void {
    // Esto es solo para demostración. En una app real,
    // el progreso vendría del servicio de upload
    this.uploadProgress[fieldKey] = 0

    const interval = setInterval(() => {
      this.uploadProgress[fieldKey] += Math.random() * 30

      if (this.uploadProgress[fieldKey] >= 100) {
        this.uploadProgress[fieldKey] = 100
        clearInterval(interval)

        // Limpiar el progreso después de un momento
        setTimeout(() => {
          delete this.uploadProgress[fieldKey]
          this.cdr.markForCheck()
        }, 1000)
      }

      this.cdr.markForCheck()
    }, 200)
  }

  triggerFileInput(fieldKey: string): void {
    const fileInput = this.fileInputs.find((input) => input.nativeElement.id === fieldKey)

    if (fileInput) {
      fileInput.nativeElement.click()
    }
  }

  removeFile(event: Event, fieldKey: string): void {
    event.preventDefault()
    event.stopPropagation()

    delete this.selectedFiles[fieldKey]
    delete this.uploadProgress[fieldKey]

    // Limpiar el input file
    const fileInput = this.fileInputs.find((input) => input.nativeElement.id === fieldKey)

    if (fileInput) {
      fileInput.nativeElement.value = ""
    }

    // Si era el archivo principal, limpiarlo también
    if (this.selectedImage === this.selectedFiles[fieldKey]) {
      this.selectedImage = null
    }

    console.log(`Archivo removido de ${fieldKey}`)
    this.cdr.markForCheck()
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return "0 B"

    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup)
      }
    })
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName)
    return control ? control.touched && control.hasError(errorName) : false
  }

  trackByField(index: number, field: FormField): string {
    return field.key
  }

  getPlaceholder(field: any): string {
    return field.placeholder ?? ""
  }

  hasAnyError(key: string): boolean {
    const control = this.form.get(key)
    return !!(control && control.invalid && (control.dirty || control.touched))
  }

  getErrorId(key: string): string | null {
    const control = this.form.get(key)
    if (control?.errors) {
      const firstError = Object.keys(control.errors)[0]
      return `${key}-error-${firstError}`
    }
    return null
  }

  getErrorMessages(key: string): { id: string; message: string }[] {
    const control = this.form.get(key)
    if (!control?.errors) return []

    const messages: { [error: string]: string } = {
      required: "Este campo es obligatorio",
      email: "Ingrese un email válido",
      minlength: `Mínimo ${control.errors["minlength"]?.requiredLength} caracteres`,
      maxlength: `Máximo ${control.errors["maxlength"]?.requiredLength} caracteres`,
      pattern:
        key === "password"
          ? "La contraseña debe tener al menos 8 caracteres, incluyendo una letra minúscula, una mayúscula, un número y un carácter especial (@ $ ! % * ? & #)."
          : "Formato no válido",
    }

    return Object.keys(control.errors).map((error) => ({
      id: `${key}-error-${error}`,
      message: messages[error] ?? "Error desconocido",
    }))
  }
}