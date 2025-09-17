import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SectionHeaderComponent,
  ActionButton,
} from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import {
  ViewDialogComponent,
  ViewDialogColumn,
} from '../../shared/view-dialog/view-dialog.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import {
  EntityFormComponent,
  FormField,
} from '../../shared/entity-form/entity-form.component';
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
import {
  Doctor,
  DoctorCreate,
  DoctorUpdateResponse,
  MedicalSchedule,
  DoctorStatus,
} from '../../services/interfaces/doctor.interfaces';
import { Specialty } from '../../services/interfaces/hospital.interfaces';
import { NotificationService } from '../../core/notification';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    ViewDialogComponent,
    DataTableComponent,
    EntityFormComponent,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss'],
})
export class DoctorListComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private scheduleService = inject(ScheduleService);
  private specialityService = inject(SpecialityService);
  private notificationService = inject(NotificationService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  doctors: Doctor[] = [];
  schedules: MedicalSchedule[] = [];
  specialities: Specialty[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedDoctor: Doctor | null = null;
  formLoading = false;
  error: string | null = null;

  viewDialogOpen = false;
  viewDialogData: any = {};
  viewDialogTitle = '';

  headerActions: ActionButton[] = [
    {
      label: 'Asociar Horario',
      icon: 'link',
      variant: 'success',
      ariaLabel: 'Asociar horario a doctor',
      onClick: () => this.openAssignScheduleDialog(),
    },
    {
      label: 'Nuevo Doctor',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nuevo doctor',
      onClick: () => this.onAddNew(),
    },
  ];

  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  private baseFormFields: FormField[] = [
    {
      key: 'username',
      label: 'Nombre de usuario',
      type: 'text',
      required: false,
    },
    { key: 'first_name', label: 'Nombre', type: 'text', required: true },
    { key: 'last_name', label: 'Apellido', type: 'text', required: true },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validators: [Validators.email],
    },
    {
      key: 'password',
      label: 'Contraseña',
      type: 'password',
      required: false,
      validators: [
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern),
      ],
    },
    { key: 'dni', label: 'DNI', type: 'text', required: true },
    { key: 'telephone', label: 'Teléfono', type: 'text', required: true },
    {
      key: 'specialityId',
      label: 'Especialidad',
      type: 'select',
      required: true,
      options: [],
    },
    { key: 'address', label: 'Dirección', type: 'text', required: false },
    {
      key: 'bloodType',
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
      key: 'doctor_state',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: DoctorStatus.AVAILABLE, label: 'Disponible' },
        { value: DoctorStatus.BUSY, label: 'En consulta' },
        { value: DoctorStatus.OFFLINE, label: 'Fuera de servicio' },
      ],
    },
  ];

  get formFields(): FormField[] {
    if (this._formFields.length === 0 || this.formMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
        required:
          field.key === 'password'
            ? this.formMode === 'create'
            : field.required,
        validators:
          field.key === 'password' && this.formMode === 'edit'
            ? []
            : field.validators || [],
      }));
    }
    return this._formFields;
  }

  private _formFields: FormField[] = [];

  tableColumns = [
    {
      key: 'first_name',
      label: 'Nombre',
      format: (value?: string) => value || 'N/A',
    },
    {
      key: 'last_name',
      label: 'Apellido',
      format: (value?: string) => value || 'N/A',
    },
    { key: 'dni', label: 'DNI' },
    { key: 'address', label: 'Dirección' },
    { key: 'blood_type', label: 'Tipo de Sangre' },
    { key: 'email', label: 'Email' },
    {
      key: 'telephone',
      label: 'Teléfono',
      format: (value?: string) => value || 'N/A',
    },
    { key: 'specialityName', label: 'Especialidad' },
    {
      key: 'doctor_state',
      label: 'Estado',
      format: (value?: DoctorStatus) => {
        switch (value) {
          case DoctorStatus.AVAILABLE:
            return 'Disponible';
          case DoctorStatus.BUSY:
            return 'En consulta';
          case DoctorStatus.OFFLINE:
            return 'Fuera de servicio';
          default:
            return 'N/A';
        }
      },
    },
    {
      key: 'is_active',
      label: 'Activo',
      format: (value: boolean) => (value ? 'Sí' : 'No'),
    },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'first_name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'dni', label: 'DNI' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Teléfono' },
    { key: 'address', label: 'Dirección' },
    { key: 'blood_type', label: 'Tipo de Sangre' },
    { key: 'specialityName', label: 'Especialidad' },
    {
      key: 'doctor_state',
      label: 'Estado',
      format: (value?: DoctorStatus) => this.formatDoctorStatus(value),
    },
    { key: 'scheduleNames', label: 'Horarios' },
    {
      key: 'is_active',
      label: 'Activo',
      format: (value: boolean) => (value ? 'Sí' : 'No'),
    },
  ];

  private daysMap: { [key: string]: string } = {
    Sunday: 'Domingo',
    Monday: 'Lunes',
    Tuesday: 'Martes',
    Wednesday: 'Miércoles',
    Thursday: 'Jueves',
    Friday: 'Viernes',
    Saturday: 'Sábado',
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
      schedules: this.scheduleService.getSchedules(),
    }).subscribe({
      next: (result) => {
        this.schedules = result.schedules;
        this.specialities = result.specialities;
        
        this.doctors = result.doctors.map((doctor) => {      
          return {
            ...doctor,
            is_active: doctor.is_active ?? false,
            specialityName: result.specialities.find((s) => s.id === doctor.speciality_id)?.name || 'N/A',
          }
        });
        
        const specialityFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'specialityId'
        );
        if (specialityFieldIndex !== -1) {
          this.baseFormFields[specialityFieldIndex].options = this.specialities.map(
            (s) => ({
              value: s.id.toString(),
              label: s.name,
            })
          );
          this._formFields = []; // Reset para forzar recalculación
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos. Intenta nuevamente.';
        this.loading = false;
        this.logger.error('Failed to load doctors, specialities or schedules', error);
      },
    });
  }

  openAssignScheduleDialog(doctor?: Doctor): void {
    if (!this.doctors.length || !this.schedules.length) {
      this.error = 'No hay doctores o horarios disponibles para asignar.';
      return;
    }

    const dialogRef = this.dialog.open(AssignDoctorScheduleComponent, {
      data: {
        context: 'doctor',
        doctorId: doctor?.id,
        doctors: this.doctors.filter((d) => d.is_active),
        schedules: this.schedules,
      },
      width: '500px',
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: { success?: boolean; error?: string } | undefined) => {
          if (result?.success) {
            this.error = null;
            this.notificationService.success(
              'Horario asignado correctamente.',
              { duration: 5000 }
            );
            this.loadData();
          } else if (result?.error) {
            this.error = result.error;
          }
        }
      );
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedDoctor = null;
    this.showForm = true;
    this.logger.debug('Opening form for new doctor');
  }

  onEdit(doctor: Doctor): void {
    this.formMode = 'edit';
    this.selectedDoctor = {
      ...doctor,
      username: doctor.username || '',
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      dni: doctor.dni || '',
      telephone: doctor.telephone || '',
      speciality_id: doctor.speciality_id
        ? doctor.speciality_id.toString()
        : '',
      address: doctor.address || '',
      blood_type: doctor.blood_type || '',
      doctor_state: doctor.doctor_state || DoctorStatus.AVAILABLE,
    };
    this.showForm = true;
    this.logger.debug('Opening form for editing doctor', doctor);
  }

  onDelete(doctor: Doctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Doctor',
        message: `¿Está seguro de eliminar al doctor "${
          doctor.first_name || 'N/A'
        } ${doctor.last_name || 'N/A'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.doctorService.deleteDoctor(doctor.id).subscribe({
          next: () => {
            this.doctors = this.doctors.filter((d) => d.id !== doctor.id);
            this.loading = false;
            this.logger.info(
              `Doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }" eliminado correctamente`
            );
            this.notificationService.success('¡Doctor eliminado con éxito!', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al eliminar al doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }"`
            );
            this.notificationService.error(
              '¡Ocurrió un error al eliminar el doctor!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.loading = false;
          },
        });
      }
    });
  }

  onView(doctor: Doctor): void {
    this.viewDialogData = doctor;
    this.viewDialogTitle = `Doctor: ${doctor.first_name || 'N/A'} ${
      doctor.last_name || 'N/A'
    }`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for doctor', doctor);
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  private formatDoctorStatus(status?: DoctorStatus): string {
    switch (status) {
      case DoctorStatus.AVAILABLE:
        return 'Disponible';
      case DoctorStatus.BUSY:
        return 'En consulta';
      case DoctorStatus.OFFLINE:
        return 'Fuera de servicio';
      default:
        return 'N/A';
    }
  }

  onFormSubmit(formData: Partial<Doctor>): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.formMode === 'create' ? 'Crear Doctor' : 'Actualizar Doctor',
        message: `¿Está seguro de ${
          this.formMode === 'create' ? 'crear' : 'actualizar'
        } este doctor?`,
      },
    });

    const request = this.formMode === 'create'
      ? this.doctorService.createDoctor(formData as DoctorCreate)
      : this.doctorService.updateDoctor(this.selectedDoctor!.id, formData);

    // Usar forkJoin para manejar ambos observables de manera limpia
    forkJoin({
      dialogResult: dialogRef.afterClosed(),
      requestResult: request
    }).subscribe({
      next: ({ dialogResult, requestResult }) => {
        if (dialogResult) {
          // Solo si el usuario confirmó, procesamos el resultado
          this.formLoading = false;
          this.showForm = false;
          this.selectedDoctor = null;
          this.loadData();
          
          this.logger.info(
            `Doctor ${this.formMode === 'create' ? 'created' : 'updated'} successfully`
          );
          
          this.notificationService.success(
            `¡Doctor ${
              this.formMode === 'create' ? 'creado' : 'actualizado'
            } con éxito!`,
            {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            }
          );
        } else {
          // Usuario canceló, solo limpiamos el loading
          this.formLoading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        this.error = `Error al ${
          this.formMode === 'create' ? 'crear' : 'actualizar'
        } el doctor. Intenta nuevamente.`;
        
        this.logger.error(`Failed to ${this.formMode} doctor`, error);
        
        this.notificationService.error(
          `¡Ocurrió un error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
          } el doctor!`,
          {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          }
        );
      },
    });

    // Activamos el loading inmediatamente
    this.formLoading = true;
    this.error = null;
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedDoctor = null;
    this.logger.debug('Form cancelled');
  }

  onBanEvent(event: Doctor): void {
    this.onBan(event);
  }

  onUnbanEvent(event: Doctor): void {
    this.onUnban(event);
  }

  onBan(doctor: Doctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Banear Doctor',
        message: `¿Está seguro de banear al doctor "${
          doctor.first_name || 'N/A'
        } ${doctor.last_name || 'N/A'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.doctorService.banDoctor(doctor.id).subscribe({
          next: () => {
            this.doctors = this.doctors.map((d) =>
              d.id === doctor.id ? { ...d, is_active: false } : d
            );
            this.loading = false;
            this.notificationService.success(
              '¡Doctor baneado con éxito!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.logger.info(
              `Doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }" baneado correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al banear al doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }"`
            );
            this.notificationService.error(
              '¡Ocurrió un error al banear el doctor!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.loading = false;
          },
        });
      }
    });
  }

  onUnban(doctor: Doctor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desbanear Doctor',
        message: `¿Está seguro de desbanear al doctor "${
          doctor.first_name || 'N/A'
        } ${doctor.last_name || 'N/A'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.doctorService.unbanDoctor(doctor.id).subscribe({
          next: () => {
            this.doctors = this.doctors.map((d) =>
              d.id === doctor.id ? { ...d, is_active: true } : d
            );
            this.loading = false;
            this.notificationService.success(
              '¡Doctor desbaneado con éxito!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.logger.info(
              `Doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }" desbaneado correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al desbanear al doctor "${doctor.first_name || 'N/A'} ${
                doctor.last_name || 'N/A'
              }"`
            );
            this.notificationService.error(
              '¡Ocurrió un error al desbanear el doctor!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.loading = false;
          },
        });
      }
    });
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en DoctorListComponent:', error);
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
    } else {
      errorMessage =
        error.error?.detail ||
        error.error?.message ||
        error.message ||
        defaultMessage;
    }
    this.error = errorMessage;
  }
}