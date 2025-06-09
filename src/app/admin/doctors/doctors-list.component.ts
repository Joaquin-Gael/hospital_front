import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { DoctorService } from '../../services/doctor/doctor.service';
import { SpecialityService } from '../../services/speciality/speciality.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { Doctor, DoctorCreate, DoctorUpdateResponse } from '../../services/interfaces/doctor.interfaces';
import { Specialty } from '../../services/interfaces/hospital.interfaces';

interface ExtendedDoctor extends Doctor {
  specialityName?: string;
}

interface DoctorFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  dni: string;
  telephone: string;
  specialityId: string;
  address: string;
  bloodType: string;
}

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    DataTableComponent,
    EntityFormComponent,
    MatButtonModule,
  ],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss'],
})
export class DoctorListComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private specialityService = inject(SpecialityService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  doctors: ExtendedDoctor[] = [];
  specialities: Specialty[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedDoctor: ExtendedDoctor | null = null;
  formLoading = false;
  error: string | null = null;

  // Patrón de validación de contraseña del backend
  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  private baseFormFields: FormField[] = [
    { key: 'username', label: 'Nombre de usuario', type: 'text', required: false },
    { key: 'first_name', label: 'Nombre', type: 'text', required: true },
    { key: 'last_name', label: 'Apellido', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true, validators: [Validators.email] },
    { key: 'password', label: 'Contraseña', type: 'password', required: false, validators: [Validators.minLength(8), Validators.pattern(this.passwordPattern)] },
    { key: 'dni', label: 'DNI', type: 'text', required: true },
    { key: 'telephone', label: 'Teléfono', type: 'text', required: true },
    { key: 'specialityId', label: 'Especialidad', type: 'select', required: true, options: [] },
    { key: 'address', label: 'Dirección', type: 'text', required: false },
    { key: 'bloodType', label: 'Tipo de sangre', type: 'select', required: false, options: [
      { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
    ] },
  ];

  private _formFields: FormField[] = [];
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

  tableColumns = [
    { key: 'first_name', label: 'Nombre', format: (value?: string) => value || 'N/A' },
    { key: 'last_name', label: 'Apellido', format: (value?: string) => value || 'N/A' },
    { key: 'dni', label: 'DNI' },
    { key: 'address', label: 'Dirección' },
    { key: 'blood_type', label: 'Tipo de Sangre' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Teléfono', format: (value?: string) => value || 'N/A' },
    { key: 'specialityName', label: 'Especialidad' },
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
      doctors: this.doctorService.getDoctors(),
      specialities: this.specialityService.getSpecialities(),
    }).subscribe({
      next: (result) => {
        this.doctors = result.doctors.map((doctor) => ({
          ...doctor,
          is_active: doctor.is_active ?? false, // Valor por defecto
          specialityName: result.specialities.find((s) => s.id === doctor.speciality_id)?.name || 'N/A',
        }));

        this.specialities = result.specialities;

        const specialityFieldIndex = this.baseFormFields.findIndex((f) => f.key === 'specialityId');
        if (specialityFieldIndex !== -1) {
          this.baseFormFields[specialityFieldIndex].options = this.specialities.map((s) => ({
            value: s.id.toString(),
            label: s.name,
          }));
          this._formFields = []; // Reiniciar el caché
        }

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los datos');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedDoctor = null;
    this.showForm = true;
  }

  onEdit(doctor: ExtendedDoctor): void {
    this.formMode = 'edit';
    this.selectedDoctor = {
      ...doctor,
      username: doctor.username || '',
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      dni: doctor.dni || '',
      telephone: doctor.telephone || '',
      speciality_id: doctor.speciality_id ? doctor.speciality_id.toString() : '',
      address: doctor.address || '',
      blood_type: doctor.blood_type || '',
    };
    console.log('Datos enviados a EntityFormComponent:', this.selectedDoctor);
    this.showForm = true;
  }

  onDelete(doctor: ExtendedDoctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Doctor', message: `¿Está seguro de eliminar al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.doctorService.deleteDoctor(doctor.id).subscribe({
          next: () => {
            this.doctors = this.doctors.filter((d) => d.id !== doctor.id);
            this.loading = false;
            this.logger.info(`Doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}" eliminado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(doctor: ExtendedDoctor): void {
    alert(`Detalles del doctor:\nNombre: ${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}\nEmail: ${doctor.email}\nTeléfono: ${doctor.telephone || 'N/A'}\nEspecialidad: ${doctor.specialityName || 'N/A'}\nActivo: ${doctor.is_active ? 'Sí' : 'No'}`);
  }

  onFormSubmit(formData: DoctorFormData): void {
    if (!formData.specialityId) {
      this.error = 'Por favor, selecciona una especialidad válida.';
      this.formLoading = false;
      return;
    }
    if (this.formMode === 'create' && !formData.password) {
      this.error = 'La contraseña es requerida para crear un doctor.';
      this.formLoading = false;
      return;
    }
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
      data: { title: `${action.charAt(0).toUpperCase() + action.slice(1)} Doctor`, message: `¿Está seguro de ${action} al doctor "${formData.first_name} ${formData.last_name}"?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.formLoading = true;
      this.error = null;

      if (this.formMode === 'create') {
        const doctorData: DoctorCreate = {
          username: formData.username || '',
          email: formData.email,
          password: formData.password!,
          first_name: formData.first_name,
          last_name: formData.last_name,
          dni: formData.dni,
          telephone: formData.telephone,
          speciality_id: formData.specialityId,
          address: formData.address || '',
          blood_type: formData.bloodType || '',
        };
        console.log('Payload enviado:', doctorData);
        this.doctorService.createDoctor(doctorData).subscribe({
          next: (newDoctor) => {
            const doctorWithSpeciality: ExtendedDoctor = {
              ...newDoctor,
              specialityName: this.specialities.find((s) => s.id === newDoctor.speciality_id)?.name || 'N/A',
            };
            this.doctors.push(doctorWithSpeciality);
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Doctor "${newDoctor.first_name || 'N/A'} ${newDoctor.last_name || 'N/A'}" creado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            console.log('Errores del servidor:', error.error.detail);
            this.handleError(error, 'Error al crear el doctor');
            this.formLoading = false;
          },
        });
      } else if (this.selectedDoctor) {
        const updateData = {
          username: formData.username || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          telephone: formData.telephone || undefined,
          email: formData.email || undefined,
        };

        const currentDoctor = this.selectedDoctor;

        this.doctorService.updateDoctor(currentDoctor.id, updateData).subscribe({
          next: (updatedFields: DoctorUpdateResponse) => {
            const doctorWithSpeciality: ExtendedDoctor = {
              ...currentDoctor,
              ...updatedFields,
              id: currentDoctor.id,
              speciality_id: currentDoctor.speciality_id,
              specialityName: currentDoctor.specialityName,
            };

            const index = this.doctors.findIndex((d) => d.id === currentDoctor.id);
            if (index !== -1) {
              this.doctors[index] = doctorWithSpeciality;
            }

            if (formData.specialityId !== currentDoctor.speciality_id) {
              this.doctorService.updateDoctorSpeciality(currentDoctor.id, formData.specialityId).subscribe({
                next: (updatedWithSpeciality) => {
                  doctorWithSpeciality.speciality_id = updatedWithSpeciality.speciality_id;
                  doctorWithSpeciality.specialityName = this.specialities.find((s) => s.id === updatedWithSpeciality.speciality_id)?.name || 'N/A';
                  this.doctors[index] = doctorWithSpeciality;
                },
                error: (error) => this.handleError(error, 'Error al actualizar la especialidad'),
              });
            }

            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Doctor "${updatedFields.first_name || 'N/A'} ${updatedFields.last_name || 'N/A'}" actualizado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            console.log('Errores del servidor:', error.error.detail);
            this.handleError(error, 'Error al actualizar el doctor');
            this.formLoading = false;
          },
        });
      } else {
        this.error = 'No se seleccionó un doctor para editar.';
        this.formLoading = false;
      }
    });
  }

  // Métodos intermedios para manejar los eventos
  onBanEvent(event: any): void {
    const doctor = event as ExtendedDoctor;
    this.onBan(doctor);
  }

  onUnbanEvent(event: any): void {
    const doctor = event as ExtendedDoctor;
    this.onUnban(doctor);
  }

  onBan(doctor: ExtendedDoctor): void {
    console.log('Ban clicked for doctor:', doctor);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Banear Doctor', message: `¿Está seguro de banear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.doctorService.banDoctor(doctor.id).subscribe({
          next: (response) => {
            this.doctors = this.doctors.map((d) => (d.id === doctor.id ? { ...d, is_active: false } : d));
            this.loading = false;
            this.logger.info(`Doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}" baneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al banear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onUnban(doctor: ExtendedDoctor): void {
    console.log('Unban clicked for doctor:', doctor);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Desbanear Doctor', message: `¿Está seguro de desbanear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.doctorService.unbanDoctor(doctor.id).subscribe({
          next: (response) => {
            this.doctors = this.doctors.map((d) => (d.id === doctor.id ? { ...d, is_active: true } : d));
            this.loading = false;
            this.logger.info(`Doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}" desbaneado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al desbanear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en DoctorListComponent:', error);
    let errorMessage = defaultMessage;
    if (error.status === 422 && error.error?.detail) {
      const details = error.error.detail;
      if (Array.isArray(details)) {
        errorMessage = details.map((err: any) => `${err.loc.join('.')} (${err.type}): ${err.msg}`).join('; ');
      } else {
        errorMessage = details || defaultMessage;
      }
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    this.error = errorMessage;
    console.log('Error completo:', error);
  }
}