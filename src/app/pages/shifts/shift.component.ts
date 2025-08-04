import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  animate, 
  style, 
  transition, 
  trigger, 
  query, 
  stagger, 
  state
} from '@angular/animations';

interface Service {
  id: number;
  name: string;
  icon: string;
  price: number;
  description: string;
}

interface ReasonOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './shift.component.html',
  styleUrls: ['./shift.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      state('inactive', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.05)' })),
      transition('inactive => active', animate('300ms ease-in')),
      transition('active => inactive', animate('300ms ease-out'))
    ]),
    trigger('rotateIcon', [
      transition(':enter', [
        style({ transform: 'rotate(-90deg)', opacity: 0 }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ transform: 'rotate(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ShiftsComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  appointmentForm!: FormGroup;
  minDate = new Date();
  availableTimeSlots: string[] = [];
  buttonState = 'inactive';
  showCustomReason = false;
  isLoading = false;
  
  currentStep = 1;
  totalSteps = 4;
  
  services: Service[] = [
    { 
      id: 1, 
      name: 'Consulta médica', 
      icon: 'medical_services', 
      price: 80000, 
      description: 'Consulta general con médico especialista'
    },
    { 
      id: 2, 
      name: 'Tratamiento dental', 
      icon: 'sentiment_satisfied', 
      price: 120000, 
      description: 'Limpieza, revisión y tratamientos dentales'
    },
    { 
      id: 3, 
      name: 'Terapia física', 
      icon: 'fitness_center', 
      price: 95000, 
      description: 'Rehabilitación y terapia especializada'
    },
    { 
      id: 4, 
      name: 'Asesoría nutricional', 
      icon: 'restaurant', 
      price: 70000, 
      description: 'Plan alimentario personalizado'
    },
    { 
      id: 5, 
      name: 'Consulta psicológica', 
      icon: 'psychology', 
      price: 110000, 
      description: 'Apoyo psicológico y terapia emocional'
    }
  ];
  
  reasonOptions: ReasonOption[] = [
    { id: 1, name: 'Primera consulta' },
    { id: 2, name: 'Seguimiento' },
    { id: 3, name: 'Urgencia' },
    { id: 4, name: 'Control rutinario' },
    { id: 5, name: 'Otro (especificar)' }
  ];
  
  ngOnInit(): void {
    this.initForm();
    this.watchFormChanges();
  }
  
  initForm(): void {
    this.appointmentForm = this.fb.group({
      service: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      appointmentTime: [null, Validators.required],
      reasonOption: [null, Validators.required],
      customReason: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }
  
  watchFormChanges(): void {
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.generateTimeSlots(date);
      }
    });
    
    this.appointmentForm.get('reasonOption')?.valueChanges.subscribe(option => {
      this.showCustomReason = option === 5;
      
      if (this.showCustomReason) {
        this.appointmentForm.get('customReason')?.setValidators([Validators.required, Validators.minLength(10)]);
      } else {
        this.appointmentForm.get('customReason')?.clearValidators();
      }
      
      this.appointmentForm.get('customReason')?.updateValueAndValidity();
    });
  }
  
  generateTimeSlots(date: Date): void {
    const slots: string[] = [];
    const selectedDate = new Date(date);
    const today = new Date();
    
    let startHour = 8;
    if (this.isSameDay(selectedDate, today) && today.getHours() >= 8) {
      startHour = today.getHours() + 1;
    }
    
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour - 1) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    this.availableTimeSlots = slots;
    this.appointmentForm.get('appointmentTime')?.setValue(null);
  }
  
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  proceedToPayment(): void {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }
    
    this.isLoading = true;
    
    const appointmentData = {
      service: this.getSelectedService(),
      date: this.appointmentForm.get('appointmentDate')?.value,
      time: this.appointmentForm.get('appointmentTime')?.value,
      reason: this.getReasonText(),
      total: this.getSelectedServicePrice()
    };
    
    console.log('Proceeding to payment with data:', appointmentData);
    
    // Aquí iría la lógica para redirigir a la pasarela de pago
    setTimeout(() => {
      this.isLoading = false;
      // Simular redirección a pasarela de pago
      alert('Redirigiendo a la pasarela de pago...');
    }, 2000);
  }
  
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
  
  getErrorMessage(controlName: string): string {
    const control = this.appointmentForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control?.hasError('minlength')) {
      return 'Debe tener al menos 10 caracteres';
    }
    
    return '';
  }
  
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    } else {
      this.markFormGroupTouched(this.appointmentForm);
    }
  }
  
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  goToStep(step: number): void {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.currentStep = step;
    }
  }
  
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: {
        const serviceControl = this.appointmentForm.get('service');
        return !!serviceControl?.valid;
      }
      case 2: {
        const dateControl = this.appointmentForm.get('appointmentDate');
        const timeControl = this.appointmentForm.get('appointmentTime');
        return !!dateControl?.valid && !!timeControl?.valid;
      }
      case 3: {
        const reasonControl = this.appointmentForm.get('reasonOption');
        const customReasonControl = this.appointmentForm.get('customReason');
        return !!reasonControl?.valid && 
               (!this.showCustomReason || !!customReasonControl?.valid);
      }
      case 4: {
        const termsControl = this.appointmentForm.get('termsAccepted');
        return !!termsControl?.valid;
      }
      default:
        return true;
    }
  }
  
  onButtonHover(isHovering: boolean): void {
    this.buttonState = isHovering ? 'active' : 'inactive';
  }
  
  getSelectedService(): Service | null {
    const serviceId = this.appointmentForm.get('service')?.value;
    return this.services.find(s => s.id === serviceId) || null;
  }
  
  getSelectedServicePrice(): number {
    const service = this.getSelectedService();
    return service?.price || 0;
  }
  
  getServiceIcon(serviceId: number): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.icon || 'help_outline';
  }
  
  getServiceName(serviceId: number | null): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.name || '';
  }
  
  getReasonText(): string {
    const reasonOptionId = this.appointmentForm.get('reasonOption')?.value;
    const customReason = this.appointmentForm.get('customReason')?.value;
    
    if (reasonOptionId === 5) {
      return customReason || '';
    }
    const reason = this.reasonOptions.find(r => r.id === reasonOptionId);
    return reason?.name || '';
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('es-ES', options);
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}