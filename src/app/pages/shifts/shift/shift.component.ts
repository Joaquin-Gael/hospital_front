import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { ServiceService } from '../../../services/service/service.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { LoggerService } from '../../../services/core/logger.service';
import { UserService } from '../../../services/user/user.service';
import { HealthInsuranceService } from '../../../services/health_insarunce/health-insurance.service';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../core/notification';
import { MedicalScheduleDaysResponse, Service, MedicalScheduleCreate } from '../../../services/interfaces/hospital.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { TurnState, TurnCreate } from '../../../services/interfaces/appointment.interfaces';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';
import { ReasonOption } from '../interfaces/appointment.interfaces';
import { StepIndicatorComponent } from '../step-indicator/step-indicator.component';
import { ServiceSelectionComponent } from '../service-selection/service-selection.component';
import { DateSelectionComponent } from '../date-selection/date-selection.component';
import { TimeSelectionComponent } from '../time-selection/time-selection.component';
import { AppointmentSummaryComponent } from '../appointment-summary/appointment-summary.component';
import { NavigationButtonsComponent } from '../navigation-buttons/navigation-buttons.component';
import { HealthInsuranceSelectionComponent } from '../health-insarunce-selection/health-insarunce-selection.component';
import { CashesService } from '../../../services/cashes/cashes.service';
import { PayTurnWithCashResponse } from '../../../services/interfaces/cashes.interfaces';
import { HeroComponent, HeroData } from '../../../shared/hero/hero.component';

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
    HealthInsuranceSelectionComponent,
    HeroComponent // 👈 AGREGAR HERO
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
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private healthInsuranceService = inject(HealthInsuranceService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cashesService = inject(CashesService);

  heroData: HeroData = {
    backgroundImage: 'assets/slider-turnos.jpg',
    altText: 'Reserva de turnos Hospital SDLG',
    title: 'Reserva tu turno',
    subtitle: 'De manera rápida y sencilla ',
    highlightText: '  24/7'
  };

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
    this.handleStripeCallback();
  }

  private loadCurrentUser(): void {
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (!user) {
          this.notificationService.error('Debes iniciar sesión para reservar un turno', { duration: 5000 });
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

  onServiceChange(serviceId: string): void {
    const selectedService = this.services.find(s => s.id === serviceId);
    if (selectedService && selectedService.specialty_id) {
      this.isLoading = true;
      this.nextStep();
      this.loadAvailableDays(selectedService.specialty_id);
    } else {
      this.resetSchedules();
    }
  }

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
    const minLoadingTime = 500; 
    const startTime = Date.now();
    
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
        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minLoadingTime - elapsedTime;
        
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }, remainingTime > 0 ? remainingTime : 0);
      },
      error: (error: HttpErrorResponse) => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minLoadingTime - elapsedTime;
        
        setTimeout(() => {
          this.isLoading = false;
          this.currentStep = 1;
          this.handleError(error, 'Error al cargar horarios');
        }, remainingTime > 0 ? remainingTime : 0);
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

  private scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      const card = document.querySelector('.appointment-card');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
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
        this.scrollToTop();
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
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.currentStep = step;
      this.scrollToTop();
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
      this.notificationService.error('Por favor, completa todos los campos requeridos', { duration: 5000 });
      return;
    }

    this.isLoading = true;
    const formValue = this.appointmentForm.value;
    const service = this.getSelectedService();
    if (!service) {
      this.notificationService.error('Servicio no válido', { duration: 5000 });
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
      next: (response: PayTurnWithCashResponse) => {
        this.logger.debug('Turno creado:', response);
        if (response.payment_url) {
          this.notificationService.success('Turno creado con éxito. Redirigiendo al pago...', { duration: 5000 });
          if (isPlatformBrowser(this.platformId)) {
            window.location.href = response.payment_url;
          }
        } else {
          this.notificationService.success('Turno creado con éxito', { duration: 5000 });
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

  private handleStripeCallback(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const search = window.location.search;
    if (!search) {
      return;
    }

    const params = new HttpParams({ fromString: search.replace(/^\?/, '') });
    const callback = this.cashesService.parseSuccessCallback(params);

    if (!callback.redirectStatus) {
      return;
    }

    this.logger.info('Stripe redirect detected', callback);

    switch (callback.redirectStatus) {
      case 'succeeded':
        this.notificationService.success('Pago confirmado. ¡Gracias por tu reserva!', {
          duration: 5000
        });
        break;
      case 'failed':
      case 'canceled':
        this.notificationService.error('El pago no se pudo completar. Puedes intentar nuevamente.', {
          duration: 5000
        });
        break;
      default:
        this.notificationService.info(
          'Estado del pago recibido. Verifica tu historial para más detalles.',
          { duration: 5000 }
        );
        break;
    }

    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
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
    this.notificationService.error(message, { duration: 5000 });
    this.error = message;
  }
}