import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import {
  EntityFormComponent,
  EntityFormPayload,
  FormField,
} from '../../shared/entity-form/entity-form.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AppointmentService } from '../../services/appointment/appointments.service';
import { UserService } from '../../services/user/user.service';
import { ServiceService } from '../../services/service/service.service';
import { DoctorService } from '../../services/doctor/doctor.service';
import { LoggerService } from '../../services/core/logger.service';
import { NotificationService } from '../../core/notification';
import { forkJoin, lastValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Turn,
  TurnCreate,
  TurnRescheduleRequest,
  TurnState,
} from '../../services/interfaces/appointment.interfaces';
import { UserRead } from '../../services/interfaces/user.interfaces';
import { Doctor } from '../../services/interfaces/doctor.interfaces';
import { Service } from '../../services/interfaces/hospital.interfaces';
import { Validators } from '@angular/forms';

interface AppointmentRow extends Turn {
  patientName: string;
  doctorName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
}

interface AppointmentFormValues extends EntityFormPayload {
  reason: string;
  user_id: string;
  service_id: string;
  health_insurance?: string | null;
  date: string;
  time: string;
  state: TurnState;
}

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    DataTableComponent,
    ViewDialogComponent,
    EntityFormComponent,
    MatDialogModule,
  ],
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss'],
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly userService = inject(UserService);
  private readonly serviceService = inject(ServiceService);
  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  appointments: AppointmentRow[] = [];
  users: UserRead[] = [];
  doctors: Doctor[] = [];
  services: Service[] = [];
  loading = false;
  formLoading = false;
  error: string | null = null;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedTurn: AppointmentRow | null = null;
  viewDialogOpen = false;
  viewDialogData: any = {};
  viewDialogTitle = '';

  readonly stateLabels: Record<TurnState, string> = {
    [TurnState.WAITING]: 'Pendiente',
    [TurnState.ACCEPTED]: 'Aceptado',
    [TurnState.FINISHED]: 'Finalizado',
    [TurnState.CANCELLED]: 'Cancelado',
    [TurnState.REJECTED]: 'Rechazado',
  };

  headerActions: ActionButton[] = [
    {
      label: 'Nuevo Turno',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Crear nuevo turno',
      onClick: () => this.onAddNew(),
    },
  ];

  tableColumns: TableColumn[] = [
    { 
      key: 'patientName', 
      label: 'Paciente',
      sortable: true
    },
    { 
      key: 'doctorName', 
      label: 'Doctor',
      sortable: true
    },
    { 
      key: 'serviceName', 
      label: 'Servicio',
      sortable: true
    },
    { 
      key: 'appointmentDate', 
      label: 'Fecha',
      sortable: true
    },
    { 
      key: 'appointmentTime', 
      label: 'Hora',
      sortable: true
    },
    {
      key: 'state',
      label: 'Estado',
      sortable: true,
      format: (value: string) => this.stateLabels[value as TurnState] ?? value,
    },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'patientName', label: 'Paciente' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'serviceName', label: 'Servicio' },
    { key: 'reason', label: 'Motivo' },
    { key: 'appointmentDate', label: 'Fecha' },
    { key: 'appointmentTime', label: 'Hora' },
    { 
      key: 'state', 
      label: 'Estado', 
      format: (value: string) => this.stateLabels[value as TurnState] ?? value 
    },
  ];

  get formFields(): FormField<AppointmentFormValues>[] {
    const baseFields: FormField<AppointmentFormValues>[] = [
      {
        key: 'reason',
        label: 'Motivo',
        type: 'text',
        required: true,
        validators: [Validators.required, Validators.maxLength(500)],
      },
      {
        key: 'user_id',
        label: 'Paciente',
        type: 'select',
        required: true,
        options: this.users.map((user) => ({
          value: user.id,
          label: `${user.first_name} ${user.last_name} (DNI: ${user.dni})`,
        })),
        validators: [Validators.required],
        readonly: this.formMode === 'edit',
      },
      {
        key: 'service_id',
        label: 'Servicio',
        type: 'select',
        required: true,
        options: this.services.map((service) => ({
          value: service.id,
          label: service.name ?? 'Servicio sin nombre',
        })),
        validators: [Validators.required],
        readonly: this.formMode === 'edit',
      },
      {
        key: 'health_insurance',
        label: 'Obra Social (Opcional)',
        type: 'text',
        required: false,
        placeholder: 'ID de obra social',
        readonly: this.formMode === 'edit',
      },
      {
        key: 'date',
        label: 'Fecha',
        type: 'date',
        required: true,
        validators: [Validators.required],
      },
      {
        key: 'time',
        label: 'Hora',
        type: 'text',
        required: true,
        validators: [
          Validators.required, 
          Validators.pattern(/^([0-1]?\d|2[0-3]):[0-5]\d$/)
        ],
        placeholder: 'HH:mm (ej: 14:30)',
      },
      {
        key: 'state',
        label: 'Estado',
        type: 'select',
        required: true,
        options: Object.entries(this.stateLabels).map(([value, label]) => ({
          value: value as TurnState,
          label,
        })),
        validators: [Validators.required],
      },
    ];

    return baseFields;
  }

  formInitialData: Partial<AppointmentFormValues> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  onView(turn: AppointmentRow): void {
    this.viewDialogData = turn;
    this.viewDialogTitle = 'Detalle del turno';
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for appointment', turn);
  }

  onEdit(turn: AppointmentRow): void {
    this.selectedTurn = turn;
    this.formMode = 'edit';
    this.showForm = true;
    this.formInitialData = {
      reason: turn.reason ?? '',
      user_id: turn.user_id ?? '',
      service_id: turn.service_id ?? '',
      health_insurance: turn.health_insurance ?? '',
      date: turn.date ?? '',
      time: turn.time?.substring(0, 5) ?? '',
      state: turn.state ?? TurnState.WAITING,
    };
    this.logger.debug('Opening form for editing appointment', turn);
  }

  onDelete(turn: AppointmentRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar turno',
        message: `¿Está seguro de eliminar el turno de ${turn.patientName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        
        this.appointmentService.deleteTurn(turn.id).subscribe({
          next: () => {
            this.appointments = this.appointments.filter((a) => a.id !== turn.id);
            this.loading = false;
            this.logger.info(`Turno eliminado correctamente`);
            
            this.notificationService.success('¡Turno eliminado correctamente!', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, 'Error al eliminar el turno');
            this.loading = false;
            
            this.notificationService.error('Ocurrió un error al eliminar el turno', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          },
        });
      }
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.showForm = true;
    this.selectedTurn = null;
    
    const today = new Date().toISOString().split('T')[0];
    
    this.formInitialData = {
      state: TurnState.WAITING,
      date: today,
      time: '09:00',
      reason: '',
    };
    
    this.logger.debug('Opening form for new appointment');
  }

  onFormCancel(): void {
    this.showForm = false;
    this.formLoading = false;
    this.formInitialData = null;
    this.selectedTurn = null;
    this.logger.debug('Form cancelled');
  }

  onFormSubmit(payload: AppointmentFormValues): void {
    if (this.formMode === 'create') {
      this.createTurn(payload);
    } else if (this.selectedTurn) {
      this.updateTurn(this.selectedTurn, payload);
    }
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
    this.viewDialogTitle = '';
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      turns: this.appointmentService.getTurns(),
      users: this.userService.getUsers(),
      doctors: this.doctorService.getDoctors(),
      services: this.serviceService.getServices(),
    }).subscribe({
      next: ({ turns, users, doctors, services }) => {
        this.users = users;
        this.doctors = doctors;
        this.services = services;
        this.appointments = this.mapTurns(turns);
        this.loading = false;
        this.logger.info(`Cargados ${this.appointments.length} turnos`);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al cargar los turnos');
        this.loading = false;
      },
    });
  }

  private mapTurns(turns: Turn[]): AppointmentRow[] {
    return turns.map((turn) => {
      const user = this.users.find((u) => u.id === turn.user_id) || turn.user;
      const doctor = this.doctors.find((d) => d.id === turn.doctor_id) || turn.doctor;
      const service = this.services.find((s) => s.id === turn.service_id) || turn.service?.[0];

      return {
        ...turn,
        patientName: user 
          ? `${user.first_name} ${user.last_name}` 
          : turn.user_id,
        doctorName: doctor 
          ? `${doctor.first_name} ${doctor.last_name}` 
          : 'Sin asignar',
        serviceName: service?.name || 'Sin servicio',
        appointmentDate: turn.date,
        appointmentTime: turn.time?.substring(0, 5) ?? 'N/A',
      };
    });
  }

  private createTurn(payload: AppointmentFormValues): void {
    this.formLoading = true;
    
    const turnData: TurnCreate = {
      reason: payload.reason.trim(),
      state: TurnState.WAITING,
      date: payload.date,
      time: payload.time,
      date_created: new Date().toISOString().split('T')[0],
      user_id: payload.user_id,
      services: [payload.service_id],
      health_insurance: payload.health_insurance?.trim() || null,
    };

    this.appointmentService.createTurn(turnData).subscribe({
      next: () => {
        this.formLoading = false;
        this.showForm = false;
        this.formInitialData = null;
        
        this.loadData();
        
        this.logger.info('Turno creado correctamente');
        this.notificationService.success('¡Turno creado correctamente!', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al crear el turno');
        this.formLoading = false;
        
        this.notificationService.error('Ocurrió un error al crear el turno', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      },
    });
  }

  private updateTurn(turn: AppointmentRow, payload: AppointmentFormValues): void {
    const actions: Array<Promise<void>> = [];
    this.formLoading = true;

    // Actualizar estado si cambió
    if (payload.state !== turn.state) {
      actions.push(
        lastValueFrom(
          this.appointmentService.updateTurnState(turn.id, payload.state)
        ).then(() => {
          this.logger.info('Estado actualizado correctamente');
        })
      );
    }

    // Reprogramar si cambió fecha, hora o motivo
    const shouldReschedule =
      payload.date !== turn.date || 
      payload.time !== turn.appointmentTime || 
      payload.reason !== turn.reason;

    if (shouldReschedule) {
      const reschedulePayload: TurnRescheduleRequest = {
        date: payload.date,
        time: payload.time,
        reason: payload.reason.trim(),
      };
      
      actions.push(
        lastValueFrom(
          this.appointmentService.rescheduleTurn(turn.id, reschedulePayload)
        ).then(() => {
          this.logger.info('Turno reprogramado correctamente');
        })
      );
    }

    Promise.all(actions)
      .then(() => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedTurn = null;
        this.formInitialData = null;
        
        this.loadData();
        
        this.notificationService.success('¡Turno actualizado correctamente!', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      })
      .catch((error: HttpErrorResponse) => {
        this.handleError(error, 'Error al actualizar el turno');
        this.formLoading = false;
        
        this.notificationService.error('Ocurrió un error al actualizar el turno', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      });
  }

  private handleError(error: HttpErrorResponse, message: string): void {
    this.logger.error(message, error);
    this.error = error.error?.detail || error.message || message;
  }
}