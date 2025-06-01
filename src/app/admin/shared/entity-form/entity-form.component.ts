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
    | 'date';
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Usar OnPush para evitar bucles innecesarios
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() fields: FormField[] = [];
  @Input() initialData: any = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() title: string = 'Formulario';
  @Input() submitLabel: string = 'Guardar';
  @Input() loading: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Solo reinicializar si hay cambios reales en fields o initialData
    if (
      (changes['fields'] && !changes['fields'].firstChange) ||
      (changes['initialData'] && !changes['initialData'].firstChange && changes['initialData'].currentValue !== changes['initialData'].previousValue)
    ) {
      this.initForm();
      this.cdr.markForCheck(); // Forzar detección de cambios solo si es necesario
    }
  }

  private initForm(): void {
    const formControls: any = {};

    // Usar initialData si existe, de lo contrario usar valores por defecto
    const data = this.initialData ? { ...this.initialData } : {};

    this.fields.forEach((field) => {
      const validators = (field.required ?? false) ? [Validators.required] : [];
      if (field.validators) {
        validators.push(...field.validators);
      }

      let value = data[field.key] ?? field.defaultValue ?? '';
      if (field.type === 'select' && !value && field.options?.length) {
        value = field.options[0].value; // Valor por defecto para select
      }

      formControls[field.key] = [value, validators];
      console.log(
        `Control ${field.key} inicializado con valor: ${value}, validadores:`,
        validators
      );
    });

    // Crear o actualizar el formulario
    if (this.form) {
      // Actualizar valores y validadores sin reinicializar el formulario completo
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
    this.formSubmit.emit(this.form.value);
  }

  onCancel(): void {
    this.formCancel.emit();
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
}