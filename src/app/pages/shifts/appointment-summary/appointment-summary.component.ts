import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';
import { ReasonOption } from '../interfaces/appointment.interfaces';

@Component({
  selector: 'app-appointment-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-summary.component.html',
  styleUrls: ['./appointment-summary.component.scss'],
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
  @Input() healthInsuranceId: string | null = null;
  @Input() healthInsurances: HealthInsuranceRead[] = [];
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

  getSelectedHealthInsurance(): HealthInsuranceRead | null {
    if (!this.healthInsuranceId) return null;
    return this.healthInsurances.find(hi => hi.id === this.healthInsuranceId) || null;
  }

  getFinalPrice(): number {
    const discount = this.getSelectedHealthInsurance()?.discount || 0;
    return this.servicePrice * (1 - discount / 100);
  }
}