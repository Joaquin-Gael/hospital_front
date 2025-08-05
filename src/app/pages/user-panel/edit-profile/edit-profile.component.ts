import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService } from '../../../services/user/user.service';
import { HealthInsuranceService } from '../../../services/health_insarunce/health-insurance.service';
import { LoggerService } from '../../../services/core/logger.service';
import { UserRead, UserUpdate } from '../../../services/interfaces/user.interfaces';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';
import { EntityFormComponent, FormField } from '../../../shared/entity-form/entity-form.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityFormComponent, MatDialogModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly healthInsuranceService = inject(HealthInsuranceService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  user: UserRead | null = null;
  healthInsurances: HealthInsuranceRead[] = [];
  isSubmitting = false;
  error: string | null = null;
  initialData: any = null;
  imgProfile: File | undefined = undefined;

  formFields: FormField[] = [
    {
      key: 'username',
      label: 'Nombre de usuario',
      type: 'text',
      required: true,
      readonly: true,
      validators: [Validators.required, Validators.minLength(3)],
    },
    {
      key: 'first_name',
      label: 'Nombre',
      type: 'text',
      required: true,
      readonly: true,
      validators: [Validators.required],
    },
    {
      key: 'last_name',
      label: 'Apellido',
      type: 'text',
      required: true,
      readonly: true,
      validators: [Validators.required],
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      type: 'email',
      required: true,
      validators: [Validators.required, Validators.email],
    },
    {
      key: 'telephone',
      label: 'Teléfono',
      type: 'text',
      required: false,
      validators: [Validators.pattern(/^\+?\d{9,15}$/)],
    },
    {
      key: 'address',
      label: 'Dirección',
      type: 'text',
      required: false,
    },
    {
      key: 'health_insurance_id',
      label: 'Obra social',
      type: 'select',
      required: false,
      options: [{ value: '', label: 'Sin obra social' }],
    },
    {
      key: 'blood_type',
      label: 'Tipo de sangre',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Seleccionar' },
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' },
      ],
    },

    {
      key: 'current_password',
      label: 'Contraseña actual',
      type: 'password',
      required: true,
      validators: [Validators.required, Validators.minLength(8)],
    },
  ];

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (userRead) => {
        if (!userRead) {
          this.error = 'No se encontraron datos del usuario.';
          this.logger.error('No se encontraron datos del usuario');
          this.router.navigate(['/login']);
          return;
        }
        this.user = userRead;
        this.initialData = {
          username: userRead.username,
          first_name: userRead.first_name,
          last_name: userRead.last_name,
          email: userRead.email,
          telephone: userRead.telephone || '',
          address: userRead.address || '',
          health_insurance_id: userRead.health_insurance_id || '',
          blood_type: userRead.blood_type || '',
          is_active: userRead.is_active,
          is_admin: userRead.is_admin,
          is_superuser: userRead.is_superuser,
          current_password: '',
        };
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al cargar los datos del usuario');
        this.router.navigate(['/login']);
      },
    });

    this.healthInsuranceService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (healthInsurances) => {
        this.healthInsurances = healthInsurances;
        const healthInsuranceField = this.formFields.find(f => f.key === 'health_insurance_id');
        if (healthInsuranceField) {
          healthInsuranceField.options = [
            { value: '', label: 'Sin obra social' },
            ...healthInsurances.map(insurance => ({
              value: insurance.id,
              label: `${insurance.name} (${insurance.discount}% descuento)`,
            })),
          ];
        }
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al cargar las obras sociales');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imgProfile = input.files[0];
    }
  }

  onFormSubmit(formData: any): void {
    if (!this.user) {
      this.error = 'No se encontraron datos del usuario.';
      this.logger.error('No se encontraron datos del usuario');
      return;
    }

    const userId = this.user.id;
    const payload: UserUpdate = {
      email: formData.email || undefined,
      telephone: formData.telephone || undefined,
      address: formData.address || undefined,
      health_insurance_id: formData.health_insurance_id || undefined,
      blood_type: formData.blood_type || undefined,
      password: formData.current_password,
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar cambios',
        message: '¿Estás seguro de que deseas guardar los cambios en tu perfil?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isSubmitting = true;
        this.error = null;

        this.userService.updateUser(userId, payload, this.imgProfile).pipe(takeUntil(this.destroy$)).subscribe({
          next: (updatedUser) => {
            this.isSubmitting = false;
            this.error = null;
            this.logger.info(`Usuario ${updatedUser.id} actualizado exitosamente`);
            setTimeout(() => {
              this.router.navigate(['/user_panel/profile']);
            }, 2000);
          },
          error: (err: HttpErrorResponse) => {
            this.isSubmitting = false;
            this.handleError(err, 'Error al actualizar el perfil');
          },
        });
      }
    });
  }

  onFormCancel(): void {
    this.router.navigate(['/user_panel/profile']);
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error(defaultMessage, error);
    let errorMessage = defaultMessage;
    if (error.status === 422 && error.error?.detail) {
      const details = error.error.detail;
      if (Array.isArray(details)) {
        errorMessage = details
          .map((err: any) => `${err.loc.join('.')} (${err.type}): ${err.msg}`)
          .join('; ');
      } else {
        errorMessage = details || defaultMessage;
      }
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción.';
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    this.error = errorMessage;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}