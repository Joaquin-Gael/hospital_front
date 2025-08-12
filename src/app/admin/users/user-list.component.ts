import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { ViewDialogComponent } from '../../shared/view-dialog.component';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { HealthInsuranceService } from '../../services/health_insarunce/health-insurance.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { UserRead, UserCreate, UserUpdate } from '../../services/interfaces/user.interfaces';
import { HealthInsuranceRead } from '../../services/interfaces/health-insurance.interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { Subject, takeUntil, forkJoin } from 'rxjs';

interface ExtendedUser extends UserRead {
  health_insurance_name: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    DataTableComponent,
    EntityFormComponent,
    ViewDialogComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private healthInsuranceService = inject(HealthInsuranceService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  users: ExtendedUser[] = [];
  healthInsurances: HealthInsuranceRead[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedUser: ExtendedUser | null = null;
  formLoading = false;
  error: string | null = null;
  isSuperuser = false;
  imgProfile: File | undefined = undefined;
  imagePreview: string | null = null;

  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  private baseFormFields: FormField[] = [
    { key: 'username', label: 'Usuario', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true, validators: [Validators.required, Validators.email] },
    { key: 'first_name', label: 'Nombre', type: 'text', required: true },
    { key: 'last_name', label: 'Apellido', type: 'text', required: true },
    { key: 'dni', label: 'DNI', type: 'text', required: true, validators: [Validators.required, Validators.pattern(/^\d{8}[A-Z]?$/i)] },
    { key: 'password', label: 'Contraseña', type: 'password', required: false, validators: [Validators.minLength(8), Validators.pattern(this.passwordPattern)] },
    { key: 'address', label: 'Dirección', type: 'text', required: false },
    { key: 'telephone', label: 'Teléfono', type: 'text', required: false, validators: [Validators.pattern(/^\+?\d{9,15}$/)] },
    { key: 'health_insurance_id', label: 'Obra Social', type: 'select', required: false, options: [] },
    { key: 'blood_type', label: 'Tipo de Sangre', type: 'select', required: false, options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ] },
  ];

  get formFields(): FormField[] {
    if (this._formFields.length === 0 || this.formMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
        required: field.key === 'password' ? this.formMode === 'create' : field.required,
        validators: field.key === 'password' && this.formMode === 'edit' ? [] : field.validators || [],
      }));
    }
    return this._formFields;
  }

  private _formFields: FormField[] = [];

  tableColumns = [
    { key: 'img_profile', label: 'Imagen', format: (value: string | null) => value ? `<img src="${value}" alt="Profile" class="table__image" />` : 'Sin imagen' },
    { key: 'username', label: 'Usuario' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'dni', label: 'DNI' },
    { key: 'address', label: 'Dirección' },
    { key: 'telephone', label: 'Teléfono' },
    { key: 'blood_type', label: 'Tipo de Sangre' },
    { key: 'health_insurance_name', label: 'Obra Social', format: (value: string) => value || 'Sin obra social' },
    { key: 'is_active', label: 'Activo', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_admin', label: 'Admin', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_superuser', label: 'Superusuario', format: (value: boolean) => (value ? 'Sí' : 'No') },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      users: this.userService.getUsers(),
      healthInsurances: this.healthInsuranceService.getAll(),
      userAuth: this.authService.getUser().pipe(takeUntil(this.destroy$))
    }).subscribe({
      next: (result) => {
        this.healthInsurances = result.healthInsurances;
        this.isSuperuser = result.userAuth?.is_superuser || false;
        this.users = result.users.map((user) => ({
          ...user,
          health_insurance_name: user.health_insurance_id
            ? this.healthInsurances.find(hi => hi.id === user.health_insurance_id)?.name || 'Obra social no encontrada'
            : 'Sin obra social'
        }));
        this.updateHealthInsuranceOptions();
        this.updateFormFields();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los datos o verificar permisos');
        this.loading = false;
      },
    });
  }

  private updateHealthInsuranceOptions(): void {
    const healthInsuranceField = this.baseFormFields.find(f => f.key === 'health_insurance_id');
    if (healthInsuranceField) {
      healthInsuranceField.options = [
        { value: '', label: 'Sin obra social' },
        ...this.healthInsurances.map(hi => ({
          value: hi.id.toString(),
          label: hi.name
        }))
      ];
    }
  }

  private updateFormFields(): void {
    if (this.formMode === 'create') {
      const passwordField = this.baseFormFields.find(f => f.key === 'password');
      if (passwordField) {
        passwordField.required = true;
        passwordField.validators = [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)];
      }
    } else {
      const passwordField = this.baseFormFields.find(f => f.key === 'password');
      if (passwordField) {
        passwordField.required = false;
        passwordField.validators = [];
      }
    }

    if (!this.isSuperuser) {
      const restrictedFields = ['username', 'first_name', 'last_name', 'is_active', 'is_admin', 'is_superuser'];
      this.baseFormFields.forEach(field => {
        if (restrictedFields.includes(field.key)) {
          field.readonly = true;
        }
      });
    }

    this._formFields = [];
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedUser = null;
    this.imgProfile = undefined;
    this.imagePreview = null;
    this.updateFormFields();
    this.showForm = true;
  }

  onEdit(user: ExtendedUser): void {
    this.formMode = 'edit';
    this.selectedUser = { ...user };
    this.imgProfile = undefined;
    this.imagePreview = user.img_profile || null;
    this.updateFormFields();
    this.showForm = true;
  }

  onDelete(user: ExtendedUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Usuario',
        message: `¿Está seguro de eliminar al usuario "${user.username}" (${user.first_name} ${user.last_name})?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.userService.deleteUser(user.id.toString()).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" eliminado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar al usuario "${user.username}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(user: ExtendedUser): void {
    this.dialog.open(ViewDialogComponent, {
      data: {
        item: user,
        columns: this.tableColumns,
        title: `Detalles de ${user.username}`
      },
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  onFormSubmit(formData: any): void {
    if (formData.password && !this.passwordPattern.test(formData.password)) {
      this.error = 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra minúscula, una mayúscula, un número y un carácter especial (@$!%*?&#).';
      this.formLoading = false;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      this.error = 'Por favor, ingresa un correo electrónico válido.';
      this.formLoading = false;
      return;
    }
    if (!formData.dni) {
      this.error = 'El DNI es requerido.';
      this.formLoading = false;
      return;
    }

    const action = this.formMode === 'create' ? 'crear' : 'editar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`, message: `¿Está seguro de ${action} al usuario "${formData.first_name} ${formData.last_name}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      this.formLoading = true;
      this.error = null;

      if (this.formMode === 'create') {
        const userData: UserCreate = {
          username: formData.username,
          email: formData.email,
          password: formData.password!,
          first_name: formData.first_name,
          last_name: formData.last_name,
          dni: formData.dni,
          telephone: formData.telephone,
          address: formData.address || undefined,
          blood_type: formData.blood_type || undefined,
          health_insurance_id: formData.health_insurance_id || undefined,
        };

        this.userService.createUser(userData, this.imgProfile).pipe(takeUntil(this.destroy$)).subscribe({
          next: (newUser: UserRead) => {
            const userWithHealthInsurance: ExtendedUser = {
              ...newUser,
              health_insurance_name: newUser.health_insurance_id
                ? this.healthInsurances.find(hi => hi.id === newUser.health_insurance_id)?.name || 'Obra social no encontrada'
                : 'Sin obra social'
            };
            this.logger.debug('user', userWithHealthInsurance)
            this.users.push(userWithHealthInsurance);
            this.formLoading = false;
            this.showForm = false;
            this.imgProfile = undefined;
            this.imagePreview = null;
            this.logger.info(`Usuario "${newUser.username}" creado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, 'Error al crear el usuario');
            this.formLoading = false;
          },
        });
      } else if (this.selectedUser) {
        const updateData: UserUpdate = {
          username: this.isSuperuser ? formData.username : undefined,
          first_name: this.isSuperuser ? formData.first_name : undefined,
          last_name: this.isSuperuser ? formData.last_name : undefined,
          telephone: formData.telephone || undefined,
          address: formData.address || undefined,
          health_insurance_id: formData.health_insurance_id || undefined,
        };

        this.userService.updateUser(this.selectedUser.id.toString(), updateData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (updatedUser: UserRead) => {
            const userWithHealthInsurance: ExtendedUser = {
              ...updatedUser,
              health_insurance_name: updatedUser.health_insurance_id
                ? this.healthInsurances.find(hi => hi.id === updatedUser.health_insurance_id)?.name || 'Obra social no encontrada'
                : 'Sin obra social'
            };
            const index = this.users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
              this.users[index] = userWithHealthInsurance;
            }
            this.formLoading = false;
            this.showForm = false;
            this.imgProfile = undefined;
            this.imagePreview = null;
            this.logger.info(`Usuario "${updatedUser.username}" actualizado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, 'Error al actualizar el usuario');
            this.formLoading = false;
          },
        });
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedUser = null;
    this.imgProfile = undefined;
    this.imagePreview = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imgProfile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview = e.target?.result as string;
      reader.readAsDataURL(this.imgProfile);
    } else {
      this.imgProfile = undefined;
      this.imagePreview = null;
    }
  }

  removeImage(): void {
    this.imgProfile = undefined;
    this.imagePreview = null;
    const fileInput = document.getElementById('img_profile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onBanEvent(event: ExtendedUser): void {
    this.onBan(event);
  }

  onUnbanEvent(event: ExtendedUser): void {
    this.onUnban(event);
  }

  onBan(user: ExtendedUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Banear Usuario',
        message: `¿Está seguro de banear al usuario "${user.username}" (${user.first_name} ${user.last_name})?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.userService.banUser(user.id.toString()).pipe(takeUntil(this.destroy$)).subscribe({
          next: (bannedUser: UserRead) => {
            const index = this.users.findIndex(u => u.id === bannedUser.id);
            if (index !== -1) {
              this.users[index] = {
                ...bannedUser,
                health_insurance_name: bannedUser.health_insurance_id
                  ? this.healthInsurances.find(hi => hi.id === bannedUser.health_insurance_id)?.name || 'Obra social no encontrada'
                  : 'Sin obra social'
              };
            }
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" baneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al banear al usuario "${user.username}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onUnban(user: ExtendedUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desbanear Usuario',
        message: `¿Está seguro de desbanear al usuario "${user.username}" (${user.first_name} ${user.last_name})?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.userService.unbanUser(user.id.toString()).pipe(takeUntil(this.destroy$)).subscribe({
          next: (unbannedUser: UserRead) => {
            const index = this.users.findIndex(u => u.id === unbannedUser.id);
            if (index !== -1) {
              this.users[index] = {
                ...unbannedUser,
                health_insurance_name: unbannedUser.health_insurance_id
                  ? this.healthInsurances.find(hi => hi.id === unbannedUser.health_insurance_id)?.name || 'Obra social no encontrada'
                  : 'Sin obra social'
              };
            }
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" desbaneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al desbanear al usuario "${user.username}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en UserListComponent:', error);
    let errorMessage = defaultMessage;
    if (error.status === 422 && error.error?.detail) {
      const details = error.error.detail;
      errorMessage = Array.isArray(details)
        ? details.map((err: any) => `${err.loc.join('.')} (${err.type}): ${err.msg}`).join('; ')
        : details || defaultMessage;
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción. Contacta a un administrador.';
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