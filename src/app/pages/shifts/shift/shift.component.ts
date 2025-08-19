import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { ServiceService } from '../../../services/service/service.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { LoggerService } from '../../../services/core/logger.service';
import { UserService } from '../../../services/user/user.service';
import { HealthInsuranceService } from '../../../services/health_insarunce/health-insurance.service';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { MedicalScheduleDaysResponse, Service, MedicalScheduleCreate } from '../../../services/interfaces/hospital.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { TurnState, TurnCreate, PayTurnResponse } from '../../../services/interfaces/appointment.interfaces';
import { ReasonOption } from '../interfaces/appointment.interfaces'
import { StepIndicatorComponent } from '../step-indicator/step-indicator.component';
import { ServiceSelectionComponent } from '../service-selection/service-selection.component';
import { DateSelectionComponent } from '../date-selection/date-selection.component';
import { TimeSelectionComponent } from '../time-selection/time-selection.component';
import { AppointmentSummaryComponent } from '../appointment-summary/appointment-summary.component';
import { NavigationButtonsComponent } from '../navigation-buttons/navigation-buttons.component';
import { HealthInsuranceSelectionComponent } from '../health-insarunce-selection/health-insarunce-selection.component';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces'

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepIndicatorComponent,
    ServiceSelectionComponent,
    DateSelectionComponent,
    TimeSelectionComponent,
    AppointmentSummaryComponent,
    NavigationButtonsComponent,
    HealthInsuranceSelectionComponent
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
    trigger('rotateIcon', [
      transition(':enter', [
        style({ transform: 'rotate(-90deg)', opacity: 0 }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'rotate(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ShiftsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceService = inject(ServiceService);
  private scheduleService = inject(ScheduleService);
  private logger = inject(LoggerService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private healthInsuranceService = inject(HealthInsuranceService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Data properties
  services: Service[] = [];
  schedules: MedicalScheduleCreate[] = [];
  availableDays: string[] = [];
  availableTimeSlots: string[] = [];
  currentUser: UserRead | null = null;
  healthInsurances: HealthInsuranceRead[] = [];

  // Form and UI state
  appointmentForm!: FormGroup;
  error: string | null = null;
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
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (!user) {
          this.snackBar.open('Debes iniciar sesión para reservar un turno', 'Cerrar', { duration: 5000 });
          this.router.navigate(['/login']);
          return;
        }
        this.loadHealthInsurances();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar datos del usuario');
        this.router.navigate(['/login']);
      }
    });
  }

  private loadHealthInsurances(): void {
    if (!this.currentUser?.health_insurance?.length) {
      this.healthInsurances = [];
      this.totalSteps = 4;
      this.appointmentForm.get('healthInsurance')?.setValue(null);
      return;
    }

    this.healthInsuranceService.getAll().subscribe({
      next: (insurances) => {
        this.healthInsurances = insurances.filter(insurance =>
          this.currentUser!.health_insurance.includes(insurance.id)
        );
        this.totalSteps = this.healthInsurances.length > 1 ? 5 : 4;
        if (this.healthInsurances.length === 1) {
          this.appointmentForm.get('healthInsurance')?.setValue(this.healthInsurances[0].id);
        } else if (this.healthInsurances.length > 1) {
          this.appointmentForm.get('healthInsurance')?.setValidators([Validators.required]);
          this.appointmentForm.get('healthInsurance')?.updateValueAndValidity();
        }
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar obras sociales');
        this.healthInsurances = [];
        this.totalSteps = 4;
        this.appointmentForm.get('healthInsurance')?.setValue(null);
      }
    });
  }

  initForm(): void {
    this.appointmentForm = this.fb.group({
      service: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      appointmentTime: [null, Validators.required],
      reasonOption: [null, Validators.required],
      customReason: [''],
      termsAccepted: [false, Validators.requiredTrue],
      healthInsurance: [null]
    });
  }

  watchFormChanges(): void {
    this.appointmentForm.get('service')?.valueChanges.pipe(debounceTime(300)).subscribe(serviceId => {
      if (serviceId) {
        const selectedService = this.services.find(s => s.id === serviceId);
        if (selectedService && selectedService.specialty_id) {
          this.loadAvailableDays(selectedService.specialty_id);
        } else {
          this.resetSchedules();
        }
      } else {
        this.resetSchedules();
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

  onServiceChange(serviceId: string): void {}

  onReasonChange(reasonId: number): void {}

  onButtonHover(isHovering: boolean): void {
    this.buttonState = isHovering ? 'active' : 'inactive';
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

  loadAvailableDays(specialtyId: string): void {
    this.isLoading = true;
    this.scheduleService.getAvailableDays(specialtyId).subscribe({
      next: (response: MedicalScheduleDaysResponse) => {
        this.schedules = response.available_days.map(day => ({
          day: day.day,
          start_time: day.start_time,
          end_time: day.end_time
        }));
        this.availableDays = [...new Set(this.schedules.map(s => s.day))];
        this.appointmentForm.get('appointmentDate')?.setValue(null);
        this.appointmentForm.get('appointmentTime')?.setValue(null);
        this.availableTimeSlots = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleError(error, 'Error al cargar horarios');
      }
    });
  }

  private resetSchedules(): void {
    this.schedules = [];
    this.availableDays = [];
    this.availableTimeSlots = [];
    this.appointmentForm.get('appointmentDate')?.setValue(null);
    this.appointmentForm.get('appointmentTime')?.setValue(null);
  }

  generateTimeSlots(date: Date): void {
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const dayMap: { [key: string]: string } = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const englishDay = dayMap[dayOfWeek] || '';
    const matchingSchedules = this.schedules.filter(s => s.day.toLowerCase() === englishDay.toLowerCase());

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
    const [startHours, startMinutes] = startTime.split(':').slice(0, 2).map(Number);
    const [endHours, endMinutes] = endTime.split(':').slice(0, 2).map(Number);
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);
    const today = new Date();
    const isToday = this.isSameDay(this.appointmentForm.get('appointmentDate')?.value, today);

    let current = start;
    if (isToday) {
      const now = new Date();
      if (now > start) {
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

  dayFilter = (date: Date | null): boolean => {
    if (!date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }

    if (!this.availableDays.length) {
      return false;
    }

    const dayMap: { [key: string]: string } = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const englishDay = dayMap[dayOfWeek] || '';
    const isAvailable = this.availableDays.includes(englishDay);
    return isAvailable;
  };

  isSameDay(date1: Date | null, date2: Date): boolean {
    if (!date1) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      } else {
        this.onSubmit();
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
        if (this.totalSteps === 4) {
          const reasonControl = this.appointmentForm.get('reasonOption');
          const customReasonControl = this.appointmentForm.get('customReason');
          const termsControl = this.appointmentForm.get('termsAccepted');
          return !!reasonControl?.valid && 
                 (!this.showCustomReason || !!customReasonControl?.valid) && 
                 !!termsControl?.valid;
        } else {
          return !!this.appointmentForm.get('healthInsurance')?.valid;
        }
      case 5:
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

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  get serviceControl(): FormControl {
    return this.appointmentForm.get('service') as FormControl;
  }

  get dateControl(): FormControl {
    return this.appointmentForm.get('appointmentDate') as FormControl;
  }

  get timeControl(): FormControl {
    return this.appointmentForm.get('appointmentTime') as FormControl;
  }

  get reasonControl(): FormControl {
    return this.appointmentForm.get('reasonOption') as FormControl;
  }

  get customReasonControl(): FormControl {
    return this.appointmentForm.get('customReason') as FormControl;
  }

  get termsControl(): FormControl {
    return this.appointmentForm.get('termsAccepted') as FormControl;
  }

  get healthInsuranceControl(): FormControl {
    return this.appointmentForm.get('healthInsurance') as FormControl;
  }

  getSelectedService(): Service | null {
    const serviceId = this.appointmentForm.get('service')?.value;
    return this.services.find(s => s.id === serviceId) || null;
  }

  getSelectedServicePrice(): number {
    const service = this.getSelectedService();
    return service?.price || 0;
  }

  getServiceIcon(serviceId: string): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.icon_code || 'question_mark';
  }

  getServiceName(serviceId: string | null): string {
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

  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.currentUser) {
      this.markFormGroupTouched(this.appointmentForm);
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', { duration: 5000 });
      return;
    }

    this.isLoading = true;
    const formValue = this.appointmentForm.value;
    const service = this.getSelectedService();
    if (!service) {
      this.snackBar.open('Servicio no válido', 'Cerrar', { duration: 5000 });
      this.isLoading = false;
      return;
    }

    const selectedHealthInsuranceId = formValue.healthInsurance || (this.healthInsurances.length === 1 ? this.healthInsurances[0].id : null);

    const turnData: TurnCreate = {
      reason: formValue.reasonOption === 5 ? formValue.customReason : this.reasonOptions.find(r => r.id === formValue.reasonOption)?.name || '',
      state: TurnState.WAITING,
      date: this.formatDateISO(formValue.appointmentDate),
      time: formValue.appointmentTime,
      date_created: this.formatDateISO(new Date()),
      user_id: this.currentUser.id,
      services: [service.id],
      health_insurance: selectedHealthInsuranceId,
    };

    this.logger.debug('Datos del turno enviados:', turnData);

    this.appointmentService.createTurn(turnData).subscribe({
      next: (response: PayTurnResponse) => {
        this.logger.debug('Turno creado:', response);
        if (response.payment_url) {
          this.snackBar.open('Turno creado con éxito. Redirigiendo al pago...', 'Cerrar', { duration: 5000 });
          window.location.href = response.payment_url; // Redirigir a Striper
        } else {
          this.snackBar.open('Turno creado con éxito', 'Cerrar', { duration: 5000 });
          this.router.navigate(['/user-panel']);
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al crear el turno');
        this.isLoading = false;
      }
    });
  }

  private formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en ShiftsComponent:', error);
    const errorMessages: { [key: number]: string } = {
      400: 'Datos de la solicitud inválidos. Verifica los campos ingresados.',
      401: 'No estás autorizado. Por favor, inicia sesión.',
      403: 'Acción no permitida.',
      404: 'No se encontraron horarios disponibles.',
      405: 'Método no permitido. Verifica la configuración del endpoint.',
      409: 'Conflicto al crear el turno. Intenta con otro horario.',
      500: 'Error en el servidor. Intenta de nuevo más tarde.'
    };
    const message = errorMessages[error.status] || error.error?.detail || defaultMessage;
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
    this.error = message;
  }
}