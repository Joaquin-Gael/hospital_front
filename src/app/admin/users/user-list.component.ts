import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { UserRead, UserCreate, UserUpdate } from '../../services/interfaces/user.interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, DataTableComponent, EntityFormComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  users: UserRead[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedUser: UserRead | null = null;
  formLoading: boolean = false;
  error: string | null = null;
  isSuperuser: boolean = false;
  imgProfile: File | undefined = undefined;

  tableColumns = [
    { key: 'img_profile', label: 'Imagen', format: (value: string | null) => value ? `<img src="${value}" alt="Profile" class="table__image" />` : 'Sin imagen' },
    { key: 'username', label: 'Usuario' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'dni', label: 'DNI' },
    { key: 'address', label: 'Dirección' },
    { key: 'telephone', label: 'Teléfono' },
    { key: 'blood_type', label: 'Sangre' },
    { key: 'is_active', label: 'Activo', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_admin', label: 'Admin', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_superuser', label: 'Superusuario', format: (value: boolean) => (value ? 'Sí' : 'No') },
  ];

  formFields: FormField[] = [
    {
      key: 'username',
      label: 'Usuario',
      type: 'text',
      required: true,
      validators: [Validators.required, Validators.minLength(3)],
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validators: [Validators.required, Validators.email],
    },
    {
      key: 'first_name',
      label: 'Nombre',
      type: 'text',
      required: true,
      validators: [Validators.required],
    },
    {
      key: 'last_name',
      label: 'Apellido',
      type: 'text',
      required: true,
      validators: [Validators.required],
    },
    {
      key: 'dni',
      label: 'DNI',
      type: 'text',
      required: true,
      validators: [Validators.required, Validators.pattern(/^\d{8}[A-Z]?$/i)],
    },
    {
      key: 'password',
      label: 'Contraseña',
      type: 'password',
      required: false,
      validators: [], // Sin validaciones
    },
    {
      key: 'address',
      label: 'Dirección',
      type: 'text',
      required: false,
    },
    {
      key: 'telephone',
      label: 'Teléfono',
      type: 'text',
      required: false,
      validators: [Validators.pattern(/^\+?\d{9,15}$/)],
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
      key: 'health_insurance_id',
      label: 'Obra Social',
      type: 'select',
      required: false,
      options: [{ value: '', label: 'Sin obra social' }],
    },
    {
      key: 'is_active',
      label: 'Activo',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
    {
      key: 'is_admin',
      label: 'Admin',
      type: 'checkbox',
      required: false,
      defaultValue: false,
    },
    {
      key: 'is_superuser',
      label: 'Superusuario',
      type: 'checkbox',
      required: false,
      defaultValue: false,
    },
  ];

  ngOnInit(): void {
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.isSuperuser = user?.is_superuser || false;
        this.updateFormFields();
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al verificar permisos de superusuario');
      },
    });
  }

  private updateFormFields(): void {
    if (this.formMode === 'create') {
      // Para creación, excluir campos no soportados por UserCreate
      this.formFields = this.formFields.filter(
        field => !['telephone', 'health_insurance_id', 'is_active', 'is_admin', 'is_superuser'].includes(field.key)
      );
      // Hacer contraseña requerida en creación
      const passwordField = this.formFields.find(f => f.key === 'password');
      if (passwordField) {
        passwordField.required = true;
        passwordField.validators = [Validators.required];
      }
    } else if (!this.isSuperuser) {
      // Para edición, restringir campos si no es superusuario
      const restrictedFields = ['username', 'first_name', 'last_name', 'is_active', 'is_admin', 'is_superuser'];
      this.formFields.forEach(field => {
        if (restrictedFields.includes(field.key)) {
          field.readonly = true;
        }
      });
      // Contraseña no requerida y sin validaciones en edición
      const passwordField = this.formFields.find(f => f.key === 'password');
      if (passwordField) {
        passwordField.required = false;
        passwordField.validators = [];
      }
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        console.log('Users loaded:', users);
        this.users = users;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Load users error:', error);
        this.handleError(error, 'Error al cargar los usuarios');
        this.loading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imgProfile = input.files[0];
    } else {
      this.imgProfile = undefined;
    }
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedUser = null;
    this.imgProfile = undefined;
    this.updateFormFields();
    this.showForm = true;
  }

  onEdit(user: UserRead): void {
    this.formMode = 'edit';
    this.selectedUser = user;
    this.imgProfile = undefined;
    console.log('Selected user for edit:', user);
    this.updateFormFields();
    this.showForm = true;
  }

  onDelete(user: UserRead): void {
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
            console.log('User deleted:', user.id);
            this.users = this.users.filter(u => u.id !== user.id);
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" eliminado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Delete user error:', error);
            this.handleError(error, `Error al eliminar al usuario "${user.username}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(user: UserRead): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Detalles de ${user.username}`,
        message: `
          Usuario: ${user.username}
          Nombre: ${user.first_name || 'No disponible'} ${user.last_name || ''}
          Email: ${user.email || 'No disponible'}
          DNI: ${user.dni || 'No disponible'}
          Activo: ${user.is_active ? 'Sí' : 'No'}
          Admin: ${user.is_admin ? 'Sí' : 'No'}
          Superusuario: ${user.is_superuser ? 'Sí' : 'No'}
          Dirección: ${user.address || 'No disponible'}
          Teléfono: ${user.telephone || 'No disponible'}
          Tipo de sangre: ${user.blood_type || 'No disponible'}
          Último inicio de sesión: ${user.last_login ? new Date(user.last_login).toLocaleString('es-AR') : 'No registrado'}
          Fecha de registro: ${user.date_joined ? new Date(user.date_joined).toLocaleString('es-AR') : 'No disponible'}
        `,
        confirmText: 'Cerrar',
        showCancel: false,
      },
    });
  }

  onFormSubmit(formData: any): void {
    this.formLoading = true;
    this.error = null;

    console.log('Form data enviado:', formData);

    if (this.formMode === 'create' && !formData.password) {
      this.error = 'La contraseña es requerida para crear un usuario.';
      this.formLoading = false;
      return;
    }

    if (this.formMode === 'create') {
      const payload: UserCreate = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni,
        password: formData.password,
        address: formData.address || undefined,
        blood_type: formData.blood_type || undefined,
      };

      this.userService.createUser(payload, this.imgProfile).pipe(takeUntil(this.destroy$)).subscribe({
        next: (newUser) => {
          console.log('User created:', newUser);
          this.users.push(newUser);
          this.formLoading = false;
          this.showForm = false;
          this.imgProfile = undefined;
          this.logger.info(`Usuario "${newUser.username}" creado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Create user error:', error);
          this.handleError(error, 'Error al crear el usuario');
          this.formLoading = false;
        },
      });
    } else if (this.selectedUser) {
      const payload: UserUpdate = {
        username: this.isSuperuser ? formData.username : undefined,
        first_name: this.isSuperuser ? formData.first_name : undefined,
        last_name: this.isSuperuser ? formData.last_name : undefined,

        telephone: formData.telephone || undefined,
        address: formData.address || undefined,
        health_insurance_id: formData.health_insurance_id || undefined,

      };

      this.userService.updateUser(this.selectedUser.id.toString(), payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updatedUser) => {
          console.log('User updated:', updatedUser);
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.formLoading = false;
          this.showForm = false;
          this.imgProfile = undefined;
          this.logger.info(`Usuario "${updatedUser.username}" actualizado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Update user error:', error);
          this.handleError(error, 'Error al actualizar el usuario');
          this.formLoading = false;
        },
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedUser = null;
    this.imgProfile = undefined;
  }

  onBanEvent(event: any): void {
    const user = event as UserRead;
    this.onBan(user);
  }

  onUnbanEvent(event: any): void {
    const user = event as UserRead;
    this.onUnban(user);
  }

  onBan(user: UserRead): void {
    console.log('Ban clicked for user:', user);
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
          next: (bannedUser) => {
            console.log('User banned:', bannedUser);
            const index = this.users.findIndex(u => u.id === bannedUser.id);
            if (index !== -1) {
              this.users[index] = bannedUser;
            }
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" baneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Ban user error:', error);
            this.handleError(error, `Error al banear al usuario "${user.username}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onUnban(user: UserRead): void {
    console.log('Unban clicked for user:', user);
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
          next: (unbannedUser) => {
            console.log('User unbanned:', unbannedUser);
            const index = this.users.findIndex(u => u.id === unbannedUser.id);
            if (index !== -1) {
              this.users[index] = unbannedUser;
            }
            this.loading = false;
            this.logger.info(`Usuario "${user.username}" desbaneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Unban user error:', error);
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
      if (Array.isArray(details)) {
        errorMessage = details
          .map((err: any) => `${err.loc.join('.')} (${err.type}): ${err.msg}`)
          .join('; ');
      } else {
        errorMessage = details || defaultMessage;
      }
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción. Contacta a un administrador.';
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    this.error = errorMessage;
    console.log('Error completo:', error);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}