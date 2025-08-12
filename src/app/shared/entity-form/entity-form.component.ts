import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

export interface FormField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'file';
  required?: boolean;
  options?: { value: any; label: string }[];
  validators?: any[];
  defaultValue?: any;
  readonly?: boolean;
}

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() fields: FormField[] = [];
  @Input() initialData: any = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() title: string = 'Formulario';
  @Input() submitLabel: string = 'Guardar';
  @Input() loading: boolean = false;
  @Input() enableImageUpload: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<File>();

  form!: FormGroup;
  selectedImage: File | null = null;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialData'] &&
      !changes['initialData'].firstChange &&
      !this.isEqual(
        changes['initialData'].previousValue,
        changes['initialData'].currentValue
      )
    ) {
      this.initForm();
      this.cdr.markForCheck();
    }
  }

  private isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /** Método que loggea el foco en un campo */
  logFocus(fieldKey: string): void {
    const control = this.form.get(fieldKey);
    console.log(
      `Focus en ${fieldKey}`,
      'valor:',
      control?.value,
      'válido:',
      control?.valid
    );
  }

  private initForm(): void {
    const formControls: Record<string, any> = {};
    const data = this.initialData ? { ...this.initialData } : {};

    this.fields.forEach((field) => {
      const validators = field.required ?? false ? [Validators.required] : [];
      if (field.validators) {
        validators.push(...field.validators);
      }

      let value = data[field.key] ?? field.defaultValue ?? '';
      if (
        field.type === 'select' &&
        (value === '' || value === null) &&
        field.options?.length
      ) {
        value = field.options[0].value;
      }

      formControls[field.key] = [value, validators];
    });

    if (this.form) {
      Object.keys(formControls).forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          control.setValue(formControls[key][0], { emitEvent: false });
          control.setValidators(formControls[key][1]);
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    } else {
      this.form = this.fb.group(formControls);
    }

    console.log('Formulario inicializado con valores:', this.form.value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }
    const formValue = this.form.value;
    if (this.selectedImage) {
      this.imageSelected.emit(this.selectedImage); // Emitir el archivo seleccionado
    }
    this.formSubmit.emit(formValue);
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.imageSelected.emit(this.selectedImage); // Emitir el archivo al seleccionarlo
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return control ? control.touched && control.hasError(errorName) : false;
  }

  trackByField(index: number, field: FormField): string {
    return field.key;
  }

  getPlaceholder(field: any): string {
    return field.placeholder ?? '';
  }

  hasAnyError(key: string): boolean {
    const control = this.form.get(key);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorId(key: string): string | null {
    const control = this.form.get(key);
    if (control?.errors) {
      const firstError = Object.keys(control.errors)[0];
      return `${key}-error-${firstError}`;
    }
    return null;
  }

  getErrorMessages(key: string): { id: string; message: string }[] {
    const control = this.form.get(key);
    if (!control?.errors) return [];

    const messages: { [error: string]: string } = {
      required: 'Este campo es obligatorio',
      email: 'Ingrese un email válido',
      minlength: `Mínimo ${control.errors['minlength']?.requiredLength} caracteres`,
      maxlength: `Máximo ${control.errors['maxlength']?.requiredLength} caracteres`,
      pattern:
        key === 'password'
          ? 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra minúscula, una mayúscula, un número y un carácter especial (@ $ ! % * ? & #).'
          : 'Formato no válido',
    };

    return Object.keys(control.errors).map((error) => ({
      id: `${key}-error-${error}`,
      message: messages[error] ?? 'Error desconocido',
    }));
  }
}
