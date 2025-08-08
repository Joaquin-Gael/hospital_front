import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { DoctorService } from '../../services/doctor/doctor.service';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { SpecialityService } from '../../services/speciality/speciality.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AssignDoctorScheduleComponent } from '../schedules/assign-doctor-schedule.component';
import { Doctor, DoctorCreate, DoctorUpdateResponse, MedicalSchedule, DoctorStatus } from '../../services/interfaces/doctor.interfaces';
import { Specialty } from '../../services/interfaces/hospital.interfaces';

interface ExtendedDoctor extends Doctor {
  specialityName?: string;
  scheduleNames: string;
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
  doctor_state: DoctorStatus;
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
  private scheduleService = inject(ScheduleService);
  private specialityService = inject(SpecialityService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  doctors: ExtendedDoctor[] = [];
  schedules: MedicalSchedule[] = [];
  specialities: Specialty[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedDoctor: ExtendedDoctor | null = null;
  formLoading = false;
  error: string | null = null;

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
    { key: 'doctor_state', label: 'Estado', type: 'select', required: true, options: [
      { value: DoctorStatus.AVAILABLE, label: 'Disponible' },
      { value: DoctorStatus.BUSY, label: 'En consulta' },
      { value: DoctorStatus.OFFLINE, label: 'Fuera de servicio' },
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
    { key: 'first_name', label: 'Nombre', format: (value?: string) => value || 'N/A' },
    { key: 'last_name', label: 'Apellido', format: (value?: string) => value || 'N/A' },
    { key: 'dni', label: 'DNI' },
    { key: 'address', label: 'Dirección' },
    { key: 'blood_type', label: 'Tipo de Sangre' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Teléfono', format: (value?: string) => value || 'N/A' },
    { key: 'specialityName', label: 'Especialidad' },
    { key: 'doctor_state', label: 'Estado', format: (value?: DoctorStatus) => {
      switch (value) {
        case DoctorStatus.AVAILABLE: return 'Disponible';
        case DoctorStatus.BUSY: return 'En consulta';
        case DoctorStatus.OFFLINE: return 'Fuera de servicio';
        default: return 'N/A';
      }
    }},
    { key: 'is_active', label: 'Activo', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_admin', label: 'Admin', format: (value: boolean) => (value ? 'Sí' : 'No') },
    { key: 'is_superuser', label: 'Superusuario', format: (value: boolean) => (value ? 'Sí' : 'No') },
  ];

  private daysMap: { [key: string]: string } = {
    'Sunday': 'Domingo',
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado'
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      doctors: this.doctorService.getDoctors(),
      specialities: this.specialityService.getSpecialities(),
      schedules: this.scheduleService.getSchedules()
    }).subscribe({
      next: (result) => {
        this.schedules = result.schedules;
        this.specialities = result.specialities;
        this.doctors = result.doctors.map((doctor) => {
          const associatedSchedules = this.schedules.filter(s => s.doctors?.includes(doctor.id));
          const scheduleNames = associatedSchedules.length > 0
            ? associatedSchedules.map(s => `${this.daysMap[s.day] || s.day} ${s.start_time}-${s.end_time}`).join(', ')
            : 'N/A';
          return {
            ...doctor,
            is_active: doctor.is_active ?? false,
            specialityName: result.specialities.find((s) => s.id === doctor.speciality_id)?.name || 'N/A',
            scheduleNames
          };
        });
        const specialityFieldIndex = this.baseFormFields.findIndex((f) => f.key === 'specialityId');
        if (specialityFieldIndex !== -1) {
          this.baseFormFields[specialityFieldIndex].options = this.specialities.map((s) => ({
            value: s.id.toString(),
            label: s.name,
          }));
          this._formFields = [];
        }
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los datos');
        this.loading = false;
      },
    });
  }

  openAssignScheduleDialog(doctor?: ExtendedDoctor): void {
    if (!this.doctors.length || !this.schedules.length) {
      this.error = 'No hay doctores o horarios disponibles para asignar.';
      return;
    }

    const dialogRef = this.dialog.open(AssignDoctorScheduleComponent, {
      data: {
        context: 'doctor',
        doctorId: doctor?.id,
        doctors: this.doctors.filter(d => d.is_active),
        schedules: this.schedules 
      },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: { success?: boolean; error?: string } | undefined) => {
      if (result?.success) {
        this.error = null;
        this.logger.info('Horario asociado a doctor correctamente');
        this.loadData(); 
      } else if (result?.error) {
        this.error = result.error;
      }
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
      doctor_state: doctor.doctor_state || DoctorStatus.AVAILABLE,
      scheduleNames: doctor.scheduleNames
    };
    this.showForm = true;
  }

  onDelete(doctor: ExtendedDoctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Doctor', message: `¿Está seguro de eliminar al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
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
    alert(`Detalles del doctor:\nNombre: ${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}\nEmail: ${doctor.email}\nTeléfono: ${doctor.telephone || 'N/A'}\nEspecialidad: ${doctor.specialityName || 'N/A'}\nEstado: ${this.formatDoctorStatus(doctor.doctor_state)}\nHorarios: ${doctor.scheduleNames}\nActivo: ${doctor.is_active ? 'Sí' : 'No'}`);
  }

  private formatDoctorStatus(status?: DoctorStatus): string {
    switch (status) {
      case DoctorStatus.AVAILABLE: return 'Disponible';
      case DoctorStatus.BUSY: return 'En consulta';
      case DoctorStatus.OFFLINE: return 'Fuera de servicio';
      default: return 'N/A';
    }
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
    if (!formData.doctor_state || !Object.values(DoctorStatus).includes(formData.doctor_state)) {
      this.error = 'Por favor, selecciona un estado válido (Disponible, En consulta, Fuera de servicio).';
      this.formLoading = false;
      return;
    }

    const action = this.formMode === 'create' ? 'crear' : 'editar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: `${action.charAt(0).toUpperCase() + action.slice(1)} Doctor`, message: `¿Está seguro de ${action} al doctor "${formData.first_name} ${formData.last_name}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
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
          doctor_state: formData.doctor_state,
        };
        this.logger.debug('doctor:', doctorData)
        this.doctorService.createDoctor(doctorData).subscribe({
          next: (newDoctor: Doctor) => {
            const doctorWithSpeciality: ExtendedDoctor = {
              ...newDoctor,
              specialityName: this.specialities.find((s) => s.id === newDoctor.speciality_id)?.name || 'N/A',
              scheduleNames: 'N/A',
            };
            this.doctors.push(doctorWithSpeciality);
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Doctor "${newDoctor.first_name || 'N/A'} ${newDoctor.last_name || 'N/A'}" creado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, 'Error al crear el doctor');
            this.formLoading = false;
          },
        });
      } else if (this.selectedDoctor) {
        const updateData: Partial<DoctorCreate> = {
          username: formData.username || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.first_name || undefined,
          telephone: formData.telephone || undefined,
          email: formData.email || undefined,
          doctor_state: formData.doctor_state,
        };

        const currentDoctor = this.selectedDoctor;
        
        this.logger.debug('doctor actual data:', currentDoctor)
        this.doctorService.updateDoctor(currentDoctor.id, updateData).subscribe({
          next: (updatedFields: DoctorUpdateResponse) => {
            const doctorWithSpeciality: ExtendedDoctor = {
              ...currentDoctor,
              ...updatedFields,
              id: currentDoctor.id,
              speciality_id: currentDoctor.speciality_id,
              specialityName: currentDoctor.specialityName,
              scheduleNames: currentDoctor.scheduleNames,
            };

            const index = this.doctors.findIndex((d) => d.id === currentDoctor.id);
            if (index !== -1) {
              this.doctors[index] = doctorWithSpeciality;
            }

            if (formData.specialityId !== currentDoctor.speciality_id) {
              this.doctorService.updateDoctorSpeciality(currentDoctor.id, formData.specialityId).subscribe({
                next: (updatedWithSpeciality: Doctor) => {
                  doctorWithSpeciality.speciality_id = updatedWithSpeciality.speciality_id;
                  doctorWithSpeciality.specialityName = this.specialities.find((s) => s.id === updatedWithSpeciality.speciality_id)?.name || 'N/A';
                  this.doctors[index] = doctorWithSpeciality;
                },
                error: (error: HttpErrorResponse) => this.handleError(error, 'Error al actualizar la especialidad'),
              });
            }

            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Doctor "${updatedFields.first_name || 'N/A'} ${updatedFields.last_name || 'N/A'}" actualizado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
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

  onBanEvent(event: ExtendedDoctor): void {
    this.onBan(event);
  }

  onUnbanEvent(event: ExtendedDoctor): void {
    this.onUnban(event);
  }

  onBan(doctor: ExtendedDoctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Banear Doctor', message: `¿Está seguro de banear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.doctorService.banDoctor(doctor.id).subscribe({
          next: () => {
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Desbanear Doctor', message: `¿Está seguro de desbanear al doctor "${doctor.first_name || 'N/A'} ${doctor.last_name || 'N/A'}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.doctorService.unbanDoctor(doctor.id).subscribe({
          next: () => {
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
  }
}
