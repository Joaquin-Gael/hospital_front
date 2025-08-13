import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-time-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-step" @slideIn>
      <h3 class="step-title">Selecciona un horario</h3>
      <p class="step-subtitle">Elige un horario disponible para tu consulta</p>

      <div class="custom-form-field" *ngIf="!isLoading; else loadingSpinner">
        <label class="field-label">
          <i class="material-icons field-icon">schedule</i>
          Hora disponible
        </label>
        <div class="time-slots-grid">
          <div
            *ngFor="let timeSlot of availableTimeSlots"
            class="time-slot"
            [class.selected]="timeControl.value === timeSlot"
            (click)="onTimeSelect(timeSlot)"
            [attr.aria-label]="'Seleccionar horario ' + timeSlot"
          >
            {{ timeSlot }}
          </div>
        </div>
        <div
          *ngIf="availableTimeSlots.length === 0 && !isLoading"
          class="error-message"
          role="alert"
        >
          No hay horarios disponibles para la fecha seleccionada.
        </div>
        <div
          *ngIf="timeControl.invalid && timeControl.touched"
          class="error-message"
          role="alert"
        >
          {{ getErrorMessage() }}
        </div>
      </div>

      <ng-template #loadingSpinner>
        <div class="loading-spinner">
          <i class="material-icons loading-icon">hourglass_empty</i>
          <span>Cargando horarios...</span>
        </div>
      </ng-template>

      <div *ngIf="error" class="error-message centered-error" role="alert">
        {{ error }}
      </div>
    </div>
  `,
  styleUrl: './time-selection.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class TimeSelectionComponent {
  @Input() timeControl!: FormControl;
  @Input() availableTimeSlots: string[] = [];
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Output() timeChange = new EventEmitter<string>();

  onTimeSelect(timeSlot: string): void {
    this.timeControl.setValue(timeSlot);
    this.timeChange.emit(timeSlot);
  }

  getErrorMessage(): string {
    if (this.timeControl?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    return '';
  }
}