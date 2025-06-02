import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { UserService } from '../../services/user/user.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { UserRead, UserCreate, UserUpdate } from '../../services/interfaces/user.interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, EntityFormComponent, MatDialogModule, MatIconModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  users: UserRead[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedUser: UserRead | null = null;
  formLoading: boolean = false;
  error: string | null = null;

  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  tableColumns = [
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
      validators: [Validators.required],
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
      validators: [
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ],
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
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().subscribe({
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

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedUser = null;

    const passwordField = this.formFields.find(f => f.key === 'password');
    if (passwordField) {
      passwordField.required = true;
      passwordField.validators = [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ];
    }

    this.showForm = true;
  }

  onEdit(user: UserRead): void {
    this.formMode = 'edit';
    this.selectedUser = user;
    console.log('Selected user for edit:', user); // Log para depuración

    const passwordField = this.formFields.find(f => f.key === 'password');
    if (passwordField) {
      passwordField.required = false;
      passwordField.validators = [
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ];
    }

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

        this.userService.deleteUser(user.id.toString()).subscribe({
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
    alert(
      `Detalles del usuario:\nUsuario: ${user.username}\nNombre: ${user.first_name} ${user.last_name}\nEmail: ${user.email}\nDNI: ${user.dni}\nActivo: ${
        user.is_active ? 'Sí' : 'No'
      }${user.address ? `\nDirección: ${user.address}` : ''}${user.telephone ? `\nTeléfono: ${user.telephone}` : ''}${
        user.blood_type ? `\nTipo de sangre: ${user.blood_type}` : ''}${user.is_admin ? `\nAdmin: ${user.is_admin ? 'Sí' : 'No'}` : ''}${user.is_superuser ? `\nSuperusuario: ${user.is_superuser ? 'Sí' : 'No'}` : ''}${
        user.last_login ? `\nÚltimo inicio de sesión: ${new Date(user.last_login).toLocaleString()}` : ''
      }`
    );
  }

  onFormSubmit(formData: UserCreate | UserUpdate): void {
    this.formLoading = true;
    this.error = null;

    console.log('Form data enviado:', formData);

    if (this.formMode === 'create' && !formData.password) {
      this.error = 'La contraseña es requerida para crear un usuario.';
      this.formLoading = false;
      return;
    }

    if (formData.password && !this.passwordPattern.test(formData.password)) {
      this.error = 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra minúscula, una mayúscula, un número y un carácter especial (@$!%*?&#).';
      this.formLoading = false;
      return;
    }
    
    /*
    if (this.formMode === 'edit' && !formData.password) {
      delete formData.password;
    }
    */

    if (this.formMode === 'create') {
      this.userService.createUser(formData as UserCreate).subscribe({
        next: (newUser) => {
          console.log('User created (full response):', newUser);
          this.users.push(newUser);
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Usuario "${newUser.username}" creado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Create user error (full response):', error);
          this.handleError(error, 'Error al crear el usuario');
          this.formLoading = false;
        },
      });
    } else if (this.selectedUser) {
      this.userService.updateUser(this.selectedUser.id.toString(), formData as UserUpdate).subscribe({
        next: (updatedUser) => {
          console.log('User updated (full response):', updatedUser);
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Usuario "${updatedUser.username}" actualizado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Update user error (full response):', error);
          this.handleError(error, 'Error al actualizar el usuario');
          this.formLoading = false;
        },
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedUser = null; // Limpiar selectedUser al cancelar
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
}