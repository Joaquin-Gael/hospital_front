import { Component, OnInit, inject } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, style, transition, trigger, query, stagger, state } from '@angular/animations';
import { Service } from '../../services/interfaces/hospital.interfaces';
import { MedicalSchedule } from '../../services/interfaces/doctor.interfaces'
import { ServiceService } from '../../services/service/service.service';
import { DoctorService } from '../../services/doctor/doctor.service';
import { LoggerService } from '../../services/core/logger.service';
import { debounceTime } from 'rxjs/operators';

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
  private snackBar = inject(MatSnackBar);

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

  reasonOptions: ReasonOption[] = [
    { id: 1, name: 'Primera consulta' },
    { id: 2, name: 'Seguimiento' },
    { id: 3, name: 'Urgencia' },
    { id: 4, name: 'Control rutinario' },
    { id: 5, name: 'Otro (especificar)' }
  ];
  
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

  watchFormChanges(): void {
    this.appointmentForm.get('service')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(serviceId => {
      if (serviceId) {
        this.loadSchedules(serviceId);
      } else {
        this.schedules = [];
        this.availableDays = [];
        this.availableTimeSlots = [];
        this.appointmentForm.get('appointmentDate')?.setValue(null);
        this.appointmentForm.get('appointmentTime')?.setValue(null);
      }
    });

    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.generateTimeSlots(date);
      } else {
        this.availableTimeSlots = [];
        this.appointmentForm.get('appointmentTime')?.setValue(null);
      }
    });
    
    this.appointmentForm.get('reasonOption')?.valueChanges.subscribe(option => {
      this.showCustomReason = option === 5;
      const customReasonControl = this.appointmentForm.get('customReason');
      if (this.showCustomReason) {
        customReasonControl?.setValidators([Validators.required, Validators.minLength(10)]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  loadServices(): void {
    this.isLoading = true;
    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.services = services.map((s) => ({
          ...s,
          duration: undefined,
          isActive: true,
        }));
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleError(error, 'Error al cargar los servicios');
      },
    });
  }

  loadSchedules(serviceId: string): void {
    this.isLoading = true;
    this.doctorService.getAvailableSchedules(serviceId).subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.availableDays = [...new Set(schedules.map(schedule => schedule.day))];
        this.appointmentForm.get('appointmentDate')?.setValue(null);
        this.appointmentForm.get('appointmentTime')?.setValue(null);
        this.availableTimeSlots = [];
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleError(error, 'Error al cargar horarios');
      }
    });
  }

  generateTimeSlots(date: Date): void {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const matchingSchedules = this.schedules.filter(
      s => s.day.toLowerCase() === dayOfWeek.toLowerCase()
    );

    if (!matchingSchedules.length) {
      this.availableTimeSlots = [];
      this.appointmentForm.get('appointmentTime')?.setValue(null);
      return;
    }

    const allSlots = matchingSchedules.flatMap(schedule =>
      this.generateTimeIntervals(schedule.start_time, schedule.end_time)
    );
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
    if (isToday) {
      const now = new Date();
      if (now.getHours() > start.getHours() || (now.getHours() === start.getHours() && now.getMinutes() >= start.getMinutes())) {
        const minutes = now.getMinutes();
        const nextInterval = Math.ceil((minutes + 1) / intervalMinutes) * intervalMinutes;
        current.setHours(now.getHours(), nextInterval, 0, 0);
      }
    }

    while (current < end) {
      slots.push(this.formatTime(current));
      current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
    }
    return slots;
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

  dayFilter = (date: Date | null): boolean => {
    if (!date || !this.availableDays.length) return false;
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    return this.availableDays.includes(dayOfWeek);
  };

  isSameDay(date1: Date | null, date2: Date): boolean {
    if (!date1) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  /*
  proceedToPayment(): void {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('service', this.appointmentForm.get('service')?.value.toString());
    formData.append('date', this.appointmentForm.get('appointmentDate')?.value.toISOString());
    formData.append('time', this.appointmentForm.get('appointmentTime')?.value);
    formData.append('reason', this.getReasonText());

    this.serviceService.createAppointment(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open('Cita creada con éxito. Redirigiendo al pago...', 'Cerrar', { duration: 5000 });
        setTimeout(() => {
          window.location.href = '/payment-gateway'; // Reemplazar con la URL real
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleError(error, 'Error al crear la cita');
      }
    });
  }
  */

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
      case 1:
        return !!this.appointmentForm.get('service')?.valid;
      case 2:
        return !!this.appointmentForm.get('appointmentDate')?.valid;
      case 3:
        return !!this.appointmentForm.get('appointmentTime')?.valid;
      case 4:
        const reasonControl = this.appointmentForm.get('reasonOption');
        const customReasonControl = this.appointmentForm.get('customReason');
        const termsControl = this.appointmentForm.get('termsAccepted');
        return !!reasonControl?.valid && 
               (!this.showCustomReason || !!customReasonControl?.valid) && 
               !!termsControl?.valid;
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
    return reasonOptionId === 5 ? customReason || '' : this.reasonOptions.find(r => r.id === reasonOptionId)?.name || '';
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

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en ShiftsComponent:', error);
    const errorMessages: { [key: number]: string } = {
      404: 'No se encontraron horarios disponibles.',
      500: 'Error en el servidor. Intenta de nuevo más tarde.'
    };
    const message = errorMessages[error.status] || error.error?.detail || defaultMessage;
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
    this.error = message;
  }
}