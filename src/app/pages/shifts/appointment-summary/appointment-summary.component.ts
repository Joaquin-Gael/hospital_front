import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Service } from '../../../services/interfaces/hospital.interfaces';
import { ReasonOption } from '../interfaces/appointment.interfaces';

@Component({
  selector: 'app-appointment-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-step" @slideIn>
      <h3 class="step-title">Resumen de tu cita</h3>
      <p class="step-subtitle">Verifica la información antes de proceder</p>

      <div class="summary-card">
        <div class="summary-header">
          <i class="material-icons">receipt</i>
          <h4>Detalles de la reserva</h4>
        </div>

        <div class="summary-content">
          <div class="summary-item">
            <div class="summary-label">
              <i class="material-icons">{{ serviceIcon }}</i>
              Servicio:
            </div>
            <div class="summary-value">
              <span class="service-name">{{ serviceName }}</span>
              <span class="service-price">{{ formatPrice(servicePrice) }}</span>
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-label">
              <i class="material-icons">event</i>
              Fecha y Hora:
            </div>
            <div class="summary-value">
              <span>{{ formattedDate }}</span>
              <span class="time-highlight">{{ selectedTime }}</span>
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-label">
              <i class="material-icons">description</i>
              Motivo:
            </div>
            <div class="summary-value">
              <span>{{ reasonText }}</span>
            </div>
          </div>
        </div>

        <div class="summary-footer">
          <div class="total-amount">
            <span class="total-label">Total a pagar:</span>
            <span class="total-price">{{ formatPrice(servicePrice) }}</span>
          </div>
        </div>
      </div>

      <div class="custom-form-field">
        <h4 class="step-title">Motivo de la consulta</h4>
        <div class="reason-options">
          <div
            *ngFor="let reason of reasonOptions"
            class="reason-card"
            [class.selected]="reasonControl.value === reason.id"
            (click)="onReasonSelect(reason.id)"
            [attr.aria-label]="'Seleccionar motivo ' + reason.name"
          >
            <div class="reason-name">{{ reason.name }}</div>
          </div>
        </div>
        <div
          *ngIf="reasonControl.invalid && reasonControl.touched"
          class="error-message"
          role="alert"
        >
          {{ getReasonErrorMessage() }}
        </div>
      </div>

      <div
        *ngIf="showCustomReason"
        class="custom-form-field custom-reason-field"
        @fadeInOut
      >
        <label class="field-label">
          <i class="material-icons field-icon">edit</i>
          Especifica el motivo de tu consulta
        </label>
        <div class="field-input-container">
          <textarea
            [formControl]="customReasonControl"
            placeholder="Describe detalladamente el motivo de tu visita (mínimo 10 caracteres)"
            rows="4"
            aria-label="Describe el motivo específico de tu visita"
            class="custom-input textarea-input"
          ></textarea>
        </div>
        <div
          *ngIf="customReasonControl.invalid && customReasonControl.touched"
          class="error-message"
          role="alert"
        >
          {{ getCustomReasonErrorMessage() }}
        </div>
      </div>

      <div class="terms-checkbox">
        <label class="checkbox-container">
          <input
            type="checkbox"
            [formControl]="termsControl"
            aria-label="Aceptar términos y condiciones"
          />
          <span class="checkmark"></span>
          <span class="checkbox-label">
            Acepto los
            <a href="#" class="terms-link">términos y condiciones</a>
            y las
            <a href="#" class="terms-link">políticas de privacidad</a>
          </span>
        </label>
        <div
          *ngIf="termsControl.invalid && termsControl.touched"
          class="error-message"
          role="alert"
        >
          Debes aceptar los términos y condiciones
        </div>
      </div>
    </div>
  `,
  styleUrl: './appointment-summary.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class AppointmentSummaryComponent {
  @Input() reasonControl!: FormControl;
  @Input() customReasonControl!: FormControl;
  @Input() termsControl!: FormControl;
  @Input() reasonOptions: ReasonOption[] = [];
  @Input() showCustomReason = false;
  @Input() serviceIcon = 'question_mark';
  @Input() serviceName = '';
  @Input() servicePrice = 0;
  @Input() formattedDate = '';
  @Input() selectedTime = '';
  @Input() reasonText = '';
  @Output() reasonChange = new EventEmitter<number>();

  onReasonSelect(reasonId: number): void {
    this.reasonControl.setValue(reasonId);
    this.reasonChange.emit(reasonId);
  }

  getReasonErrorMessage(): string {
    if (this.reasonControl?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    return '';
  }

  getCustomReasonErrorMessage(): string {
    if (this.customReasonControl?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (this.customReasonControl?.hasError('minlength')) {
      return 'Debe tener al menos 10 caracteres';
    }
    return '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}