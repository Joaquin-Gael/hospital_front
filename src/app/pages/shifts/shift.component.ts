import { Component, OnInit, inject } from '@angular/core';
import { debounce, debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
import { Service } from '../../services/interfaces/hospital.interfaces';
import { MedicalSchedule } from '../../services/interfaces/doctor.interfaces';
import { ServiceService } from '../../services/service/service.service';
import { DoctorService } from '../../services/doctor/doctor.service'; 
import { LoggerService } from '../../services/core/logger.service';

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
  private serviceService = inject(ServiceService);
  private doctorService = inject(DoctorService);
  private logger = inject(LoggerService);

  services: Service[] = [];
  schedules: MedicalSchedule[] = [];
  availableDays: string[] = [];
  availableTimeSlots: string[] = [];
  
  error: string | null = null;
  appointmentForm!: FormGroup;
  minDate = new Date();
  buttonState = 'inactive';
  showCustomReason = false;
  isLoading = false;
  
  currentStep = 1;
  totalSteps = 4;

  
  ngOnInit(): void {
    this.loadServices();
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

  loadServices(): void {
    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.services = services.map((s) => ({
          ...s,
          duration: undefined,
          isActive: true,
        }));

      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error al cargar los servicios:', error);
      },
    });
  }

  reasonOptions: ReasonOption[] = [
    { id: 1, name: 'Primera consulta' },
    { id: 2, name: 'Seguimiento' },
    { id: 3, name: 'Urgencia' },
    { id: 4, name: 'Control rutinario' },
    { id: 5, name: 'Otro (especificar)' }
  ];
  
  loadSchedules(serviceId: string): void{
    this.doctorService.getAvailableSchedules(serviceId).subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.availableDays = [... new Set(schedules.map(schedule => schedule.day))];
        this.appointmentForm.get('appointmentDate')?.setValue(null);
        this.appointmentForm.get('appointmentTime')?.setValue(null);
        this.availableTimeSlots = [];
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error al cargar los horarios disponibles:', error);
      }
    })
  }

  watchFormChanges(): void {
    this.appointmentForm.get('service')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(serviceId => {
      if (serviceId) {
        this.loadSchedules(serviceId);
      } else { 

      }
    })

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
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const matchingSchedules = this.schedules.filter(
        s => s.day.toLowerCase() === dayOfWeek.toLowerCase()
      );

      if (!matchingSchedules.length) {
        this.availableTimeSlots = [];
        return;
      }

      // Combinar intervalos de todos los horarios disponibles para el día
      const allSlots = matchingSchedules.flatMap(schedule =>
        this.generateTimeIntervals(schedule.start_time, schedule.end_time)
      );
      // Eliminar duplicados y ordenar
      this.availableTimeSlots = [...new Set(allSlots)].sort((a, b) => a.localeCompare(b));
      this.appointmentForm.get('appointmentTime')?.setValue(null);
  }

  generateTimeIntervals(startTime: string, endTime: string, intervalMinutes = 30): string[] {
      const slots: string[] = [];
      const start = this.parseTime(startTime);
      const end = this.parseTime(endTime);
      const today = new Date();
      const isToday = this.isSameDay(this.appointmentForm.get('appointmentDate')?.value, today);

      let current = start;
      if (isToday && today.getHours() >= start.getHours()) {
        // Ajustar la hora de inicio al próximo intervalo disponible
        const minutes = today.getMinutes();
        const nextInterval = Math.ceil((minutes + 1) / intervalMinutes) * intervalMinutes;
        current.setHours(today.getHours(), nextInterval, 0, 0);
      }

      while (current < end) {
        slots.push(this.formatTime(current));
        current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
      }
      return slots;
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
      //service: this.getSelectedService(),
      date: this.appointmentForm.get('appointmentDate')?.value,
      time: this.appointmentForm.get('appointmentTime')?.value,
      reason: this.getReasonText(),
      //total: this.getSelectedServicePrice()
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
    return service?.icon_code || 'question_mark';
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

  parseTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}