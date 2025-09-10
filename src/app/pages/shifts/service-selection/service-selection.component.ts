import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Service } from '../../../services/interfaces/hospital.interfaces';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-service-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="form-step" @slideIn>
      <h3 class="step-title">¿Qué servicio necesitas?</h3>
      <p class="step-subtitle">Selecciona el tipo de consulta que deseas agendar</p>

      @if (!isLoading) {
        <div class="service-options">
          @for (service of services; track service.id) {
            <div
              class="service-card"
              [class.selected]="serviceControl.value === service.id"
              (click)="onServiceSelect(service.id)"
              [attr.aria-label]="'Seleccionar servicio ' + service.name"
            >
              <div class="service-icon">
                <i class="material-icons">{{ service.icon_code || "question_mark" }}</i>
              </div>
              <div class="service-info">
                <div class="service-name">{{ service.name }}</div>
                <div class="service-description">{{ service.description }}</div>
                <div class="service-price">{{ formatPrice(service.price) }}</div>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-loading-spinner [message]="'Cargando servicios...'"></app-loading-spinner>
      }

      @if (serviceControl.invalid && serviceControl.touched){
        <div
          class="error-message centered-error"
          role="alert"
        >
          {{ getErrorMessage() }}
        </div>
      } @else {
        <div role="alert">
          {{ error }}
        </div>
      }
    </div>
  `,
  styleUrl: './service-selection.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ServiceSelectionComponent {
  @Input() services: Service[] = [];
  @Input() serviceControl!: FormControl;
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Output() serviceChange = new EventEmitter<string>();

  onServiceSelect(serviceId: string): void {
    this.serviceControl.setValue(serviceId);
    this.serviceChange.emit(serviceId);
  }

  getErrorMessage(): string {
    if (this.serviceControl?.hasError('required')) {
      return 'Este campo es obligatorio';
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