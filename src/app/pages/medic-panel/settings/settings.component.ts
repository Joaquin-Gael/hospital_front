import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, Observable, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { Doctor, DoctorUpdatePassword, DoctorUpdate, DoctorUpdateResponse } from '../../../services/interfaces/doctor.interfaces';
import { Specialty } from '../../../services/interfaces/hospital.interfaces';
import { DoctorDataService } from '../medic-panel/doctor-data.service';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeTab = 'profile';
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  notificationSettings: NotificationSetting[] = [];
  doctor: Doctor | null = null;
  specialities: Specialty[] = [];
  doctorSpecialty$: Observable<string> = new Observable<string>();
  loading = true;
  error: string | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);
  private readonly doctorDataService = inject(DoctorDataService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const token = this.storageService.getAccessToken();
    if (!token) {
      this.logger.info('No auth token found, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    this.initForms();
    this.loadNotificationSettings();
    this.loadDoctorData();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      specialty_id: [''],
    });

    this.securityForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword !== confirmPassword ? { passwordMismatch: true } : null;
  }

  loadDoctorData(): void {
    combineLatest([
      this.doctorDataService.getDoctor(),
      this.doctorDataService.getSpecialities(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([doctor, specialities]) => {
          this.doctor = doctor;
          this.specialities = specialities;
          this.doctorSpecialty$ = this.doctorDataService.getSpecialityName(doctor?.speciality_id || '');
          if (doctor) {
            this.profileForm.patchValue({
              email: doctor.email || '',
              telephone: doctor.telephone || '',
              address: doctor.address || '',
            });
          }
          this.loading = false;
          this.error = doctor ? null : 'No se encontraron datos del doctor';
          this.logger.info('Doctor and specialities loaded', {
            doctorId: doctor?.id,
            specialitiesCount: specialities.length,
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al cargar los datos';
          this.logger.error('Failed to load data in SettingsComponent', err);
        },
      });
  }

  loadNotificationSettings(): void {
    this.notificationSettings = [
      {
        id: 'new_appointment',
        label: 'Nuevas citas',
        description: 'Recibir notificaciones cuando se programe una nueva cita',
        enabled: true,
      },
      {
        id: 'appointment_reminder',
        label: 'Recordatorios de citas',
        description: 'Recibir recordatorios 24 horas antes de las citas',
        enabled: true,
      },
      {
        id: 'appointment_changes',
        label: 'Cambios en citas',
        description: 'Recibir notificaciones cuando una cita sea modificada o cancelada',
        enabled: true,
      },
      {
        id: 'new_messages',
        label: 'Nuevos mensajes',
        description: 'Recibir notificaciones cuando lleguen nuevos mensajes',
        enabled: true,
      },
      {
        id: 'system_updates',
        label: 'Actualizaciones del sistema',
        description: 'Recibir notificaciones sobre actualizaciones y mantenimiento',
        enabled: false,
      },
      {
        id: 'marketing',
        label: 'Comunicaciones de marketing',
        description: 'Recibir información sobre nuevas características y ofertas',
        enabled: false,
      },
    ];
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.error = null;
  }

  saveProfileSettings(): void {
    if (this.profileForm.invalid || !this.doctor) {
      this.profileForm.markAllAsTouched();
      this.error = 'Por favor, completa todos los campos requeridos';
      this.logger.warn('Form invalid or no doctor data');
      return;
    }

    const updateData: DoctorUpdate = {
      email: this.profileForm.get('email')?.value,
      telephone: this.profileForm.get('telephone')?.value,
      address: this.profileForm.get('address')?.value,
      speciality_id: this.profileForm.get('specialty_id')?.value || this.doctor.speciality_id,
    };

    this.loading = true;
    this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
      next: (updatedFields: DoctorUpdateResponse) => {
        const updatedDoctor = { ...this.doctor!, ...updatedFields };
        this.doctorDataService.setDoctor(updatedDoctor); // Actualizar el servicio
        this.loading = false;
        this.error = null;
        this.logger.info('Profile updated', { doctorId: this.doctor!.id });
        alert('Configuración de perfil guardada correctamente');
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al guardar los cambios';
        this.logger.error('Failed to update profile', err);
      },
    });
  }
  

  /*
  saveSecuritySettings(): void {
    if (this.securityForm.invalid || !this.doctor) {
      this.securityForm.markAllAsTouched();
      this.error = 'Por favor, completa todos los campos requeridos';
      this.logger.warn('Security form invalid or no doctor data');
      return;
    }

    const updateData: DoctorUpdatePassword = {
      password: this.securityForm.get('newPassword')?.value,
    };

    this.loading = true;
    this.doctorService.updateDoctorPassword(this.doctor.id, updateData).subscribe({
      next: (updatedFields: DoctorUpdateResponse) => {
        this.loading = false;
        this.error = null;
        this.logger.info('Password updated', { doctorId: this.doctor!.id });
        alert('Contraseña actualizada correctamente');
        this.securityForm.reset();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al actualizar la contraseña';
        this.logger.error('Failed to update password', err);
      },
    });
  }
  */
  toggleNotification(setting: NotificationSetting): void {
    setting.enabled = !setting.enabled;
    this.logger.info(`Notificación ${setting.id} ${setting.enabled ? 'activada' : 'desactivada'}`);
  }

  saveNotificationSettings(): void {
    this.loading = true;
    this.logger.info('Guardando configuración de notificaciones', this.notificationSettings);
    // Aquí deberías hacer una llamada al backend para guardar las notificaciones, si es necesario
    setTimeout(() => {
      // Simulación de guardado
      this.loading = false;
      this.error = null;
      alert('Configuración de notificaciones guardada correctamente');
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}