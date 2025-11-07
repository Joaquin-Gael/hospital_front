import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChildren,
  type ElementRef,
  type OnChanges,
  type OnInit,
  type OnDestroy,
  type QueryList,
  type SimpleChanges,
  signal,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
  ɵNullableFormControls,
} from "@angular/forms"
import { LoggerService } from "../../services/core/logger.service"

export type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "file"

export type FormFieldValue =
  | string
  | number
  | boolean
  | Date
  | File
  | string[]
  | null
  | undefined

export type EntityFormPayload = Record<string, FormFieldValue>

export interface FormFieldOption<TValue> {
  value: TValue
  label: string
}

export interface FormField<
  TPayload extends EntityFormPayload,
  TKey extends keyof TPayload & string = keyof TPayload & string,
> {
  key: TKey
  label: string
  type: FormFieldType
  required?: boolean
  options?: FormFieldOption<TPayload[TKey]>[]
  validators?: ValidatorFn[]
  defaultValue?: TPayload[TKey]
  readonly?: boolean
  placeholder?: string
}

export type EntityFormFileSelection = Record<string, File>

type EntityFormGroupControls<TPayload extends EntityFormPayload> = ɵNullableFormControls<TPayload>

@Component({
  selector: "app-entity-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityFormComponent<
  TPayload extends EntityFormPayload = EntityFormPayload,
> implements OnInit, OnChanges, OnDestroy {
  @Input() fields: FormField<TPayload>[] = []
  @Input() initialData: Partial<TPayload> | null = null
  @Input() mode: "create" | "edit" = "create"
  @Input() title = "Formulario"
  @Input() submitLabel = "Guardar"
  @Input() loading = false
  @Input() enableImageUpload = false
  @Output() formSubmit = new EventEmitter<TPayload>()
  @Output() formCancel = new EventEmitter<void>()
  @Output() imageSelected = new EventEmitter<File>()
  @Output() filesSelected = new EventEmitter<EntityFormFileSelection>()

  @ViewChildren("fileInput") fileInputs!: QueryList<ElementRef<HTMLInputElement>>

  form!: FormGroup<EntityFormGroupControls<TPayload>>
  selectedImage: File | null = null

  selectedFiles: EntityFormFileSelection = {}
  isDragOver: Record<string, boolean> = {}
  readonly uploadProgress = signal<Record<string, number>>({})
  private readonly dragCounter: Record<string, number> = {}
  readonly focusAnnouncement = signal("")
  readonly fileStatusAnnouncement = signal("")
  readonly uploadStatusAnnouncement = signal("")
  private readonly uploadTimers = new Map<string, ReturnType<typeof setInterval>>()

  constructor(
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.initForm()
  }

  ngOnDestroy(): void {
    this.uploadTimers.forEach((timer) => clearInterval(timer))
    this.uploadTimers.clear()
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

  private isEqual<T>(obj1: T, obj2: T): boolean {
    if (obj1 === obj2) return true
    if (!obj1 || !obj2) return false
    return JSON.stringify(obj1) === JSON.stringify(obj2)
  }

  hasFileFields(): boolean {
    return this.fields.some((field) => field.type === "file")
  }

  /** Método que anuncia el foco en un campo */
  announceFocus(fieldKey: keyof TPayload & string): void {
    const control = this.form.controls[fieldKey]
    const fieldLabel = this.getFieldLabel(fieldKey)
    const controlValue = control.value
    this.focusAnnouncement.set(
      controlValue === null || controlValue === undefined || controlValue === ""
        ? `${fieldLabel} enfocado`
        : `${fieldLabel} enfocado. Valor actual: ${controlValue}`,
    )
    this.logger.debug(`Campo ${fieldKey} enfocado`, controlValue)
  }

  private initForm(): void {
    const data: Partial<TPayload> = this.initialData ? { ...this.initialData } : {}

    const formControls = this.buildFormControls(data)

    this.form = new FormGroup<EntityFormGroupControls<TPayload>>(formControls)

    this.logger.debug("Formulario inicializado", this.form.getRawValue())
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form)
      return
    }
    const formValue = this.form.getRawValue()

    if (!this.isPayload(formValue)) {
      this.logger.error("El formulario contiene claves desconocidas", formValue)
      return
    }

    if (this.selectedImage) {
      this.imageSelected.emit(this.selectedImage)
    }

    if (Object.keys(this.selectedFiles).length > 0) {
      this.filesSelected.emit({ ...this.selectedFiles })
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
      this.fileStatusAnnouncement.set(`Imagen ${this.selectedImage.name} seleccionada`)
      this.logger.info("Imagen seleccionada", this.selectedImage.name)
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
        const fieldLabel = this.getFieldLabel(fieldKey)
        this.logger.warn("Intento de cargar un archivo no soportado", file.type)
        this.fileStatusAnnouncement.set(`Solo se permiten archivos de imagen para ${fieldLabel}`)
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
      const fieldLabel = this.getFieldLabel(fieldKey)
      this.logger.warn("Archivo demasiado grande", { fieldKey, size: file.size })
      this.fileStatusAnnouncement.set(`El archivo es demasiado grande. Máximo 5MB para ${fieldLabel}.`)
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

    const fieldLabel = this.getFieldLabel(fieldKey)
    this.fileStatusAnnouncement.set(`Archivo ${file.name} listo para subir en ${fieldLabel}`)
    this.logger.info(`Archivo seleccionado para ${fieldKey}`, {
      name: file.name,
      size: file.size,
    })
    this.cdr.markForCheck()
  }

  private simulateUploadProgress(fieldKey: string): void {
    // Esto es solo para demostración. En una app real,
    // el progreso vendría del servicio de upload
    this.uploadProgress.update((current) => ({ ...current, [fieldKey]: 0 }))

    const fieldLabel = this.getFieldLabel(fieldKey)
    const interval = setInterval(() => {
      this.uploadProgress.update((current) => {
        const nextValue = Math.min(100, (current[fieldKey] ?? 0) + Math.random() * 30)
        const updated = { ...current, [fieldKey]: nextValue }
        this.uploadStatusAnnouncement.set(
          `Carga de ${fieldLabel} en ${Math.round(nextValue)} por ciento`,
        )
        return updated
      })

      if ((this.uploadProgress()[fieldKey] ?? 0) >= 100) {
        const timer = this.uploadTimers.get(fieldKey)
        if (timer) {
          clearInterval(timer)
          this.uploadTimers.delete(fieldKey)
        }
        this.uploadStatusAnnouncement.set(`Carga de ${fieldLabel} completada`)
        setTimeout(() => {
          this.uploadProgress.update((current) => {
            const updated = { ...current }
            delete updated[fieldKey]
            return updated
          })
          this.cdr.markForCheck()
        }, 1000)
      }

      this.cdr.markForCheck()
    }, 200)

    const previousTimer = this.uploadTimers.get(fieldKey)
    if (previousTimer) {
      clearInterval(previousTimer)
    }
    this.uploadTimers.set(fieldKey, interval)
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

    const removedFile = this.selectedFiles[fieldKey]
    delete this.selectedFiles[fieldKey]
    this.uploadProgress.update((current) => {
      const updated = { ...current }
      delete updated[fieldKey]
      return updated
    })
    const timer = this.uploadTimers.get(fieldKey)
    if (timer) {
      clearInterval(timer)
      this.uploadTimers.delete(fieldKey)
    }

    // Limpiar el input file
    const fileInput = this.fileInputs.find((input) => input.nativeElement.id === fieldKey)

    if (fileInput) {
      fileInput.nativeElement.value = ""
    }

    // Si era el archivo principal, limpiarlo también
    if (this.selectedImage && removedFile && this.selectedImage === removedFile) {
      this.selectedImage = null
    }

    const fieldLabel = this.getFieldLabel(fieldKey)
    this.fileStatusAnnouncement.set(`Archivo eliminado de ${fieldLabel}`)
    this.logger.info(`Archivo removido de ${fieldKey}`)
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
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      }
    })
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName)
    return control ? control.touched && control.hasError(errorName) : false
  }

  trackByField(index: number, field: FormField<TPayload>): string {
    return field.key
  }

  getPlaceholder(field: FormField<TPayload>): string {
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

    const messages: Record<string, string> = {
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

  private getFieldLabel(fieldKey: string): string {
    return this.fields.find((field) => field.key === fieldKey)?.label ?? fieldKey
  }

  private buildFormControls(data: Partial<TPayload>): EntityFormGroupControls<TPayload> {
    const controls: Record<string, FormControl<FormFieldValue | null>> = {}

    this.fields.forEach((field) => {
      const validators = this.resolveValidators(field)
      const value = this.resolveControlValue(field, data)

      controls[field.key] = new FormControl<TPayload[typeof field.key] | null>(
        { value, disabled: field.readonly ?? false },
        validators,
      )
    })

    if (!this.areControlsForFields(controls)) {
      throw new Error("La configuración del formulario no coincide con los campos proporcionados")
    }

    return controls
  }

  private resolveValidators(field: FormField<TPayload>): ValidatorFn[] {
    const validators: ValidatorFn[] = []
    if (field.required) {
      validators.push(Validators.required)
    }
    if (field.validators?.length) {
      validators.push(...field.validators)
    }
    return validators
  }

  private resolveControlValue(
    field: FormField<TPayload>,
    data: Partial<TPayload>,
  ): TPayload[typeof field.key] | null {
    const dataValue = data[field.key]
    if (dataValue !== undefined && dataValue !== null) {
      return dataValue
    }

    const defaultValue = field.defaultValue
    if (defaultValue !== undefined && defaultValue !== null) {
      return defaultValue
    }

    if (field.type === "select" && field.options?.length) {
      return field.options[0].value
    }

    return null
  }

  private areControlsForFields(
    controls: Record<string, FormControl<FormFieldValue | null>>,
  ): controls is EntityFormGroupControls<TPayload> {
    const fieldKeys = new Set(this.fields.map((field) => field.key))
    const controlKeys = Object.keys(controls)

    return (
      controlKeys.length === fieldKeys.size &&
      controlKeys.every((key) => fieldKeys.has(key)) &&
      this.fields.every((field) => Object.prototype.hasOwnProperty.call(controls, field.key))
    )
  }

  private isPayload(value: unknown): value is TPayload {
    if (!this.isRecord(value)) {
      return false
    }

    const fieldKeys = new Set(this.fields.map((field) => field.key))

    return Object.keys(value).every((key) => fieldKeys.has(key))
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
  }
}