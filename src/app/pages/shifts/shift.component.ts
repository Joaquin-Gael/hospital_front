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

@Component({
  selector: 'app-shifts',
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
    ])
  ]
})
export class ShiftsComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  appointmentForm!: FormGroup;
  minDate = new Date();
  availableTimeSlots: string[] = [];
  formSubmitted = false;
  buttonState = 'inactive';
  
  services = [
    { id: 1, name: 'Consulta médica', icon: 'medical_services' },
    { id: 2, name: 'Tratamiento dental', icon: 'favorite' },
    { id: 3, name: 'Terapia física', icon: 'fitness_center' },
    { id: 4, name: 'Asesoría nutricional', icon: 'restaurant' },
    { id: 5, name: 'Consulta psicológica', icon: 'psychology' }
  ];
  
  reasonOptions = [
    { id: 1, name: 'Primera consulta' },
    { id: 2, name: 'Seguimiento' },
    { id: 3, name: 'Urgencia' },
    { id: 4, name: 'Control rutinario' },
    { id: 5, name: 'Otro (especificar)' }
  ];
  
  showCustomReason = false;
  currentStep = 1;
  totalSteps = 4;
  
  ngOnInit(): void {
    this.initForm();
    this.watchFormChanges();
  }
  
  initForm(): void {
    this.appointmentForm = this.fb.group({
      appointmentDate: [null, Validators.required],
      appointmentTime: [null, Validators.required],
      service: [null, Validators.required],
      reasonOption: [null, Validators.required],
      customReason: ['']
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
        this.appointmentForm.get('customReason')?.setValidators(Validators.required);
      } else {
        this.appointmentForm.get('customReason')?.clearValidators();
      }
      
      this.appointmentForm.get('customReason')?.updateValueAndValidity();
    });
  }
  
  generateTimeSlots(date: Date): void {
    const slots = [];
    const selectedDate = new Date(date);
    const today = new Date();
    
    let startHour = 9;
    if (this.isSameDay(selectedDate, today) && today.getHours() >= 8) {
      startHour = today.getHours() + 1;
    }
    
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    
    this.availableTimeSlots = slots;
    this.appointmentForm.get('appointmentTime')?.setValue(null);
  }
  
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }
    
    const formData = {...this.appointmentForm.value};
    
    formData.serviceName = this.getServiceName(formData.service);
    formData.reason = this.getReasonText(formData.reasonOption, formData.customReason);
    
    delete formData.reasonOption;
    delete formData.customReason;
    
    console.log('Appointment data:', formData);
    
    this.formSubmitted = true;
    
    setTimeout(() => {
      this.appointmentForm.reset();
      this.formSubmitted = false;
      this.currentStep = 1;
    }, 3000);
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
  
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: {
        const dateControl = this.appointmentForm.get('appointmentDate');
        const timeControl = this.appointmentForm.get('appointmentTime');
        return !!dateControl?.valid && !!timeControl?.valid;
      }
      case 2: {
        const serviceControl = this.appointmentForm.get('service');
        return !!serviceControl?.valid;
      }
      case 3: {
        const reasonControl = this.appointmentForm.get('reasonOption');
        const customReasonControl = this.appointmentForm.get('customReason');
        return !!reasonControl?.valid && 
               (!this.showCustomReason || !!customReasonControl?.valid);
      }
      default:
        return true;
    }
  }
  
  onButtonHover(isHovering: boolean): void {
    this.buttonState = isHovering ? 'active' : 'inactive';
  }
  
  getServiceIcon(serviceId: number): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.icon || 'help_outline';
  }
  
  getServiceName(serviceId: number | null): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.name || '';
  }
  
  getReasonText(reasonOptionId: number | null, customReason: string): string {
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
}