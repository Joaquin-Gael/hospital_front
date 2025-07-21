import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { DoctorMeResponse, Doctor, DoctorUpdate, DoctorUpdateResponse } from '../../../services/interfaces/doctor.interfaces';

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
  loading = true;
  error: string | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);
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
    this.loading = true;
    this.doctorService.getMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: DoctorMeResponse) => {
        this.doctor = response.doc ? { ...response.doc } : null;
        this.loading = false;
        if (!this.doctor) {
          this.error = 'No se encontraron datos del doctor';
          this.logger.error('No doctor data found');
          this.router.navigate(['/login']);
          return;
        }
        this.logger.info('Doctor data loaded', { doctorId: this.doctor.id });
        this.profileForm.patchValue({
          email: this.doctor.email || '',
          telephone: this.doctor.telephone || '',
          address: this.doctor.address || '',
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del doctor';
        this.loading = false;
        this.logger.error('Failed to load doctor', err);
        setTimeout(() => this.router.navigate(['/login']), 3000);
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
    if (this.profileForm.valid && this.doctor) {
      const updateData: DoctorUpdate = {
        email: this.profileForm.get('email')?.value,
        telephone: this.profileForm.get('telephone')?.value,
        address: this.profileForm.get('address')?.value,
      };
      this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
        next: (updatedFields: DoctorUpdateResponse) => {
          this.logger.info('Perfil actualizado', { doctorId: this.doctor!.id });
          // Actualizar solo los campos devueltos por la API (email, telephone)
          this.doctor = {
            ...this.doctor!,
            ...updatedFields,
          };
          alert('Configuración de perfil guardada correctamente');
        },
        error: (err) => {
          this.error = 'Error al guardar los cambios';
          this.logger.error('Failed to update profile', err);
        },
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.error = 'Por favor, completa todos los campos requeridos';
    }
  }

  saveSecuritySettings(): void {
    if (this.securityForm.valid && this.doctor) {
      const updateData: DoctorUpdate = {
        password: this.securityForm.get('newPassword')?.value,
      };
      this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
        next: (updatedFields: DoctorUpdateResponse) => {
          this.logger.info('Contraseña actualizada', { doctorId: this.doctor!.id });
          alert('Contraseña actualizada correctamente');
          this.securityForm.reset();
          // No actualizamos this.doctor, ya que la API no devuelve datos útiles
        },
        error: (err) => {
          this.error = 'Error al actualizar la contraseña';
          this.logger.error('Failed to update password', err);
        },
      });
    } else {
      this.securityForm.markAllAsTouched();
      this.error = 'Por favor, completa todos los campos requeridos';
    }
  }

  toggleNotification(setting: NotificationSetting): void {
    setting.enabled = !setting.enabled;
    this.logger.info(`Notificación ${setting.id} ${setting.enabled ? 'activada' : 'desactivada'}`);
  }

  saveNotificationSettings(): void {
    this.logger.info('Guardando configuración de notificaciones', this.notificationSettings);
    alert('Configuración de notificaciones guardada correctamente');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}