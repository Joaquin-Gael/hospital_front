import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-date-selection',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDatepickerModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatNativeDateModule
  ],
  template: `
    <div class="form-step" @slideIn>
      <h3 class="step-title">¿Cuándo quieres tu cita?</h3>
      <p class="step-subtitle">Selecciona la fecha que mejor te convenga</p>
      @if (isLoading) {
        <div class="loading-spinner">
          <i class="material-icons loading-icon">hourglass_empty</i>
          <span>Cargando fechas...</span>
        </div>
      } @else {
        <div class="custom-form-field">
          <label class="field-label">
            <i class="material-icons field-icon">calendar_today</i>
            Fecha de la cita
          </label>
          <div class="field-input-container">
            <input
              [matDatepicker]="picker"
              [formControl]="dateControl"
              [min]="minDate"
            [matDatepickerFilter]="dayFilter"
            placeholder="Selecciona una fecha"
            aria-label="Selecciona la fecha para tu turno"
            class="custom-input date-input"
          />
          <div class="field-icon-end" (click)="picker.open()">
            <i class="material-icons">event</i>
          </div>
        </div>
        <mat-datepicker #picker></mat-datepicker>
        @if (dateControl.invalid && dateControl.touched) {
          <div
            class="error-message"
            role="alert"
          >
            {{ getErrorMessage() }}
          </div>
        }
      </div>

      <ng-template #loadingSpinner>
        <div class="loading-spinner">
          <i class="material-icons loading-icon">hourglass_empty</i>
          <span>Cargando fechas...</span>
        </div>
      </ng-template>

      @if (error) {
        <div class="error-message centered-error" role="alert">
          {{ error }}
        </div>
      }
      }
    </div>
  `,
  styleUrl: './date-selection.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class DateSelectionComponent {
  @Input() dateControl!: FormControl;
  @Input() minDate = new Date();
  @Input() dayFilter!: (date: Date | null) => boolean;
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Output() dateChange = new EventEmitter<Date>();

  getErrorMessage(): string {
    if (this.dateControl?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    return '';
  }
}