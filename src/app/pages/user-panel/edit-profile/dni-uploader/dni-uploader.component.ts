import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../../core/notification';
import { LoggerService } from '../../../../services/core/logger.service';

interface DniUploadFile {
  file: File;
  preview: string;
  isValid: boolean;
  errorMessage?: string;
}

@Component({
  selector: 'app-dni-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dni-uploader.component.html',
  styleUrls: ['./dni-uploader.component.scss']
})
export class DniUploaderComponent {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  @Output() uploadSuccess = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();

  frontDni: DniUploadFile | null = null;
  backDni: DniUploadFile | null = null;
  isSubmitting = false;
  isDraggingFront = false;
  isDraggingBack = false;

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  get canSubmit(): boolean {
    return !!(this.frontDni?.isValid && this.backDni?.isValid && !this.isSubmitting);
  }

  // Eventos para drag & drop - Frente
  onDragOverFront(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFront = true;
  }

  onDragLeaveFront(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFront = false;
  }

  onDropFront(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFront = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0], 'front');
    }
  }

  // Eventos para drag & drop - Dorso
  onDragOverBack(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingBack = true;
  }

  onDragLeaveBack(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingBack = false;
  }

  onDropBack(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingBack = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0], 'back');
    }
  }

  // Manejo de selección de archivos via input
  onFileSelected(event: Event, side: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0], side);
    }
  }

  private handleFileSelection(file: File, side: 'front' | 'back'): void {
    const validation = this.validateFile(file);
    
    if (validation.isValid) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dniFile: DniUploadFile = {
          file,
          preview: e.target?.result as string,
          isValid: true
        };

        if (side === 'front') {
          this.frontDni = dniFile;
        } else {
          this.backDni = dniFile;
        }
      };
      reader.readAsDataURL(file);
    } else {
      const dniFile: DniUploadFile = {
        file,
        preview: '',
        isValid: false,
        errorMessage: validation.errorMessage
      };

      if (side === 'front') {
        this.frontDni = dniFile;
      } else {
        this.backDni = dniFile;
      }
    }
  }

  private validateFile(file: File): { isValid: boolean; errorMessage?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        errorMessage: 'Solo se permiten archivos JPEG y PNG'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: 'El archivo no puede superar los 5MB'
      };
    }

    return { isValid: true };
  }

  removeFile(side: 'front' | 'back'): void {
    if (side === 'front') {
      this.frontDni = null;
    } else {
      this.backDni = null;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit || !this.frontDni || !this.backDni) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = new FormData();
      formData.append('dni_front', this.frontDni.file);
      formData.append('dni_back', this.backDni.file);

      const response = await this.http.post('/api/dni/verify', formData).toPromise();
      
      this.notificationService.success(
        'DNI enviado correctamente para verificación',
        {
          duration: 5000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        }
      );

      this.uploadSuccess.emit(response);
      this.resetForm();

    } catch (error) {
      this.logger.error('Error al enviar DNI:', error);
      
      let errorMessage = 'Error al enviar el DNI. Inténtalo nuevamente.';
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 422 && error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.status === 413) {
          errorMessage = 'Los archivos son demasiado grandes.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Inténtalo más tarde.';
        }
      }

      this.notificationService.error(errorMessage, {
        duration: 7000,
        action: {
          label: 'Cerrar',
          action: () => this.notificationService.dismissAll(),
        },
      });

      this.uploadError.emit(errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm(): void {
    this.frontDni = null;
    this.backDni = null;
    this.isDraggingFront = false;
    this.isDraggingBack = false;
  }

  triggerFileInput(side: 'front' | 'back'): void {
    const input = document.getElementById(`${side}-file-input`) as HTMLInputElement;
    input?.click();
  }
}