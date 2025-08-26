import { Component, type OnInit, type OnDestroy, inject, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../services/auth/auth.service";
import { UserService } from "../../../services/user/user.service";
import { HealthInsuranceService } from "../../../services/health_insarunce/health-insurance.service";
import { LoggerService } from "../../../services/core/logger.service";
import type { UserRead, UserUpdate } from "../../../services/interfaces/user.interfaces";
import type { HealthInsuranceRead } from "../../../services/interfaces/health-insurance.interfaces";
import { EntityFormComponent, type FormField } from "../../../shared/entity-form/entity-form.component";
import { DniUploaderComponent } from "./dni-uploader/dni-uploader/dni-uploader.component";
import type { HttpErrorResponse } from "@angular/common/http";
import { Validators } from "@angular/forms";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "../../../shared/confirm-dialog.component";
import { NotificationService } from "../../../core/notification";

@Component({
  selector: "app-edit-profile",
  standalone: true,
  imports: [CommonModule, RouterModule, EntityFormComponent, MatDialogModule, DniUploaderComponent],
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly healthInsuranceService = inject(HealthInsuranceService);
  private readonly notificationService = inject(NotificationService);
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
  @ViewChild(EntityFormComponent) entityForm!: EntityFormComponent;

  availableHealthInsurances: HealthInsuranceRead[] = [];
  selectedHealthInsurances: HealthInsuranceRead[] = [];
  draggedInsurance: HealthInsuranceRead | null = null;
  isDraggingOver = false;

  formFields: FormField[] = [
    {
      key: "username",
      label: "Nombre de usuario",
      type: "text",
      required: true,
      readonly: true,
      validators: [Validators.required, Validators.minLength(3)],
    },
    {
      key: "first_name",
      label: "Nombre",
      type: "text",
      required: true,
      readonly: true,
      validators: [Validators.required],
    },
    {
      key: "last_name",
      label: "Apellido",
      type: "text",
      required: true,
      readonly: true,
      validators: [Validators.required],
    },
    {
      key: "address",
      label: "Dirección",
      type: "text",
      required: false,
      validators: [Validators.maxLength(255)],
    },
    {
      key: "telephone",
      label: "Teléfono",
      type: "text",
      required: false,
      validators: [Validators.pattern(/^\+?\d{9,15}$/)],
    },
    {
      key: "img_profile",
      label: "Foto de perfil",
      type: "file",
      required: false,
    },
  ];

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info("Usuario no autenticado, redirigiendo a /login");
      this.router.navigate(["/login"]);
      return;
    }

    this.authService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userRead) => {
          if (!userRead) {
            this.notificationService.error("Ocurrió un error inesperado. Por favor, inicia sesión nuevamente.", {
              duration: 5000,
              action: {
                label: "Cerrar",
                action: () => this.notificationService.dismissAll(),
              },
            });
            this.logger.error("No se encontraron datos del usuario");
            this.router.navigate(["/login"]);
            return;
          }
          this.user = userRead;
          this.initialData = {
            username: userRead.username,
            first_name: userRead.first_name,
            last_name: userRead.last_name,
            address: userRead.address || "",
            telephone: userRead.telephone || "",
            health_insurance: userRead.health_insurance || [],
            is_active: userRead.is_active,
            is_admin: userRead.is_admin,
            is_superuser: userRead.is_superuser,
          };
        },
        error: (err: HttpErrorResponse) => {
          this.notificationService.error("Ocurrió un error al cargar los datos del usuario.", {
            duration: 5000,
            action: {
              label: "Cerrar",
              action: () => this.notificationService.dismissAll(),
            },
          });
          this.router.navigate(["/login"]);
        },
      });

    this.healthInsuranceService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (healthInsurances) => {
          this.healthInsurances = healthInsurances;
          this.availableHealthInsurances = [...healthInsurances];
          this.selectedHealthInsurances = [];

          if (this.user?.health_insurance) {
            this.user.health_insurance.forEach((id) => {
              const insurance = this.availableHealthInsurances.find((ins) => ins.id === id);
              if (insurance) {
                this.selectedHealthInsurances.push(insurance);
                this.availableHealthInsurances = this.availableHealthInsurances.filter((ins) => ins.id !== id);
              }
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, "Error al cargar las obras sociales");
        },
      });
  }

  // Agregar el método trackBy
  trackByFn(index: number, insurance: HealthInsuranceRead): string {
    return insurance.id;
  }

  onDragStart(event: DragEvent, insurance: HealthInsuranceRead): void {
    this.draggedInsurance = insurance;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/html", insurance.id);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
  }

  onDropToSelected(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;

    if (this.draggedInsurance) {
      this.selectedHealthInsurances.push(this.draggedInsurance);
      this.availableHealthInsurances = this.availableHealthInsurances.filter(
        (ins) => ins.id !== this.draggedInsurance!.id
      );
      this.draggedInsurance = null;
    }
  }

  onDropToAvailable(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;

    if (this.draggedInsurance) {
      this.availableHealthInsurances.push(this.draggedInsurance);
      this.selectedHealthInsurances = this.selectedHealthInsurances.filter(
        (ins) => ins.id !== this.draggedInsurance!.id
      );
      this.draggedInsurance = null;
    }
  }

  removeFromSelected(insurance: HealthInsuranceRead): void {
    this.selectedHealthInsurances = this.selectedHealthInsurances.filter((ins) => ins.id !== insurance.id);
    this.availableHealthInsurances.push(insurance);
  }

  addToSelected(insurance: HealthInsuranceRead): void {
    this.availableHealthInsurances = this.availableHealthInsurances.filter((ins) => ins.id !== insurance.id);
    this.selectedHealthInsurances.push(insurance);
  }

  onFormSubmit(formData: any): void {
    if (!this.user) {
      this.error = "No se encontraron datos del usuario.";
      this.logger.error("No se encontraron datos del usuario");
      return;
    }

    const userId = this.user.id;
    const payload: UserUpdate = {
      username: this.user.username,
      first_name: formData.first_name || this.user.first_name,
      last_name: formData.last_name || this.user.last_name,
      address: formData.address || undefined,
      telephone: formData.telephone || undefined,
      health_insurance: this.selectedHealthInsurances.map((ins) => ins.id),
      img_profile: this.imgProfile,
    };

    this.logger.debug('lo que envio: ',payload)

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: "Confirmar cambios",
        message: "¿Estás seguro de que deseas guardar los cambios en tu perfil?",
      },
    });

    this.logger.debug('lo que envio: ',payload)
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isSubmitting = true;
        this.error = null;
        this.userService
          .updateUser(userId, payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedUser) => {
              this.isSubmitting = false;
              this.error = null;
              this.notificationService.success("¡Datos actualizados con éxito!", {
                duration: 5000,
                action: {
                  label: "Cerrar",
                  action: () => this.notificationService.dismissAll(),
                },
              });
              setTimeout(() => {
                this.router.navigate(["/user_panel/profile"]);
              }, 2000);
            },
            error: (err: HttpErrorResponse) => {
              this.isSubmitting = false;
              this.notificationService.error("¡Ocurrió un error al actualizar el perfil!", {
                duration: 5000,
                action: {
                  label: "Cerrar",
                  action: () => this.notificationService.dismissAll(),
                },
              });
              this.handleError(err, "Error al actualizar el perfil");
            },
          });
      }
    });
  }

  onFormCancel(): void {
    this.router.navigate(["/user_panel/profile"]);
  }

  onDniUploadSuccess(response: any): void {
    this.logger.info("DNI enviado exitosamente:", response);
  }

  onDniUploadError(error: string): void {
    this.logger.error("Error al enviar DNI:", error);
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error(defaultMessage, error);
    let errorMessage = defaultMessage;
    if (error.status === 422 && error.error?.detail) {
      const details = error.error.detail;
      if (Array.isArray(details)) {
        errorMessage = details.map((err: any) => `${err.loc.join(".")} (${err.type}): ${err.msg}`).join("; ");
      } else {
        errorMessage = details || defaultMessage;
      }
    } else if (error.status === 403) {
      errorMessage = "No tienes permisos para realizar esta acción.";
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    this.error = errorMessage;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.entityForm.imageSelected.subscribe((file: File) => {
      this.imgProfile = file;
    });
  }
}