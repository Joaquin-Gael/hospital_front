import { Component, type OnInit, type OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../services/auth/auth.service";
import { UserService } from "../../../services/user/user.service";
import { HealthInsuranceService } from "../../../services/health_insarunce/health-insurance.service";
import { LoggerService } from "../../../services/core/logger.service";
import { NotificationService } from "../../../core/notification";
import type { UserRead, UserUpdate } from "../../../services/interfaces/user.interfaces";
import type { HealthInsuranceRead } from "../../../services/interfaces/health-insurance.interfaces";
import type { HttpErrorResponse } from "@angular/common/http";

// Import child components
import { ProfileFormComponent } from "./profile-form/profile-form.component";
import { HealthInsuranceManagerComponent } from "./health-insurance-manager/health-insurance-manager.component";
import { DniUploaderComponent } from "./dni-uploader/dni-uploader.component";
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component'
export type TabType = 'profile' | 'insurance' | 'dni';

@Component({
  selector: "app-edit-profile",
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ProfileFormComponent,
    HealthInsuranceManagerComponent,
    DniUploaderComponent,
  ],
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
  private readonly destroy$ = new Subject<void>();
  
  loading = true; // Initialize loading state
  user: UserRead | null = null;
  healthInsurances: HealthInsuranceRead[] = [];
  isSubmitting = false;
  activeTab: TabType = 'profile';
  initialData: any = null;

  availableHealthInsurances: HealthInsuranceRead[] = [];
  selectedHealthInsurances: HealthInsuranceRead[] = [];

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info("Usuario no autenticado, redirigiendo a /login");
      this.router.navigate(["/login"]);
      return;
    }

    this.loadUserData();
    this.loadHealthInsurances();
  }

  private loadUserData(): void {
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
            img_profile: userRead.img_profile || null,
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
  }

  private loadHealthInsurances(): void {
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

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  onProfileSubmit(formData: any): void {
    if (!this.user) {
      this.logger.error("No se encontraron datos del usuario");
      return;
    }

    const userId = this.user.id;
    const payload: UserUpdate = {
      username: this.user.username,
      first_name: this.user.first_name || undefined,
      last_name: this.user.last_name || undefined,
      address: formData.address || undefined,
      telephone: formData.telephone || undefined,
      health_insurance: this.selectedHealthInsurances.map((ins) => ins.id),
      img_profile: formData.img_profile,
    };

    this.isSubmitting = true;
    this.userService
      .updateUser(userId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.isSubmitting = false;
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

  onInsurancesChanged(data: { available: HealthInsuranceRead[], selected: HealthInsuranceRead[] }): void {
    this.availableHealthInsurances = data.available;
    this.selectedHealthInsurances = data.selected;
  }

  onSaveInsurances(selectedIds: string[]): void {
    if (!this.user) return;

    const payload: UserUpdate = {
      username: this.user.username,
      first_name: this.user.first_name || undefined,
      last_name: this.user.last_name || undefined,
      address: this.user.address || undefined,
      telephone: this.user.telephone || undefined,
      health_insurance: selectedIds,
    };

    this.isSubmitting = true;
    this.userService
      .updateUser(this.user.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.isSubmitting = false;
          this.notificationService.success("¡Obras sociales actualizadas con éxito!", {
            duration: 3000,
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.notificationService.error("Error al actualizar las obras sociales", {
            duration: 5000,
          });
          this.handleError(err, "Error al actualizar las obras sociales");
        },
      });
  }

  onFormCancel(): void {
    this.router.navigate(["/user_panel/profile"]);
  }

  onDniUploadSuccess(response: any): void {
    this.logger.info("DNI enviado exitosamente:", response);
    this.notificationService.success("DNI enviado correctamente para verificación", {
      duration: 5000,
    });
  }

  onDniUploadError(error: string): void {
    this.logger.error("Error al enviar DNI:", error);
    this.notificationService.error(error, {
      duration: 7000,
    });
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}