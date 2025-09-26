import { 
  Component, 
  inject, 
  Output, 
  EventEmitter, 
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil, finalize } from 'rxjs';
import { NotificationService } from '../../../../core/notification';
import { LoggerService } from '../../../../services/core/logger.service';
import { UserService } from '../../../../services/user/user.service';
import { DniUploadFile, UploadResponse, ValidationResult } from '../../interfaces/user-panel.interfaces'
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dni-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dni-uploader.component.html',
  styleUrls: ['./dni-uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DniUploaderComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly userService = inject(UserService);
  private readonly destroy$ = new Subject<void>();

  @Output() uploadSuccess = new EventEmitter<UploadResponse>();
  @Output() uploadError = new EventEmitter<string>();

  readonly frontDni = signal<DniUploadFile | null>(null);
  readonly backDni = signal<DniUploadFile | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly isDraggingFront = signal<boolean>(false);
  readonly isDraggingBack = signal<boolean>(false);

  readonly canSubmit = computed(() => {
    const front = this.frontDni();
    const back = this.backDni();
    return !!(
      front?.isValid && 
      back?.isValid && 
      !this.isSubmitting()
    );
  });

  readonly hasFiles = computed(() => {
    return !!(this.frontDni() || this.backDni());
  });

  readonly uploadProgress = computed(() => {
    const front = this.frontDni();
    const back = this.backDni();
    let progress = 0;
    
    if (front?.isValid) progress += 50;
    if (back?.isValid) progress += 50;
    
    return progress;
  });

  // Constants
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupPreviews();
  }

  // Drag & Drop Events - Front
  onDragOverFront(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFront.set(true);
  }

  onDragLeaveFront(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFront.set(false);
  }

  onDropFront(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFront.set(false);
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0], 'front');
    }
  }

  // Drag & Drop Events - Back
  onDragOverBack(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingBack.set(true);
  }

  onDragLeaveBack(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingBack.set(false);
  }

  onDropBack(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingBack.set(false);
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0], 'back');
    }
  }

  onFileSelected(event: Event, side: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFileSelection(input.files[0], side);
    }
    input.value = '';
  }

  private async handleFileSelection(file: File, side: 'front' | 'back'): Promise<void> {
    try {
      const validation = this.validateFile(file);
      
      if (validation.isValid) {
        const preview = await this.createFilePreview(file);
        const dniFile: DniUploadFile = {
          file,
          preview,
          isValid: true
        };
        this.setDniFile(side, dniFile);
      } else {
        const dniFile: DniUploadFile = {
          file,
          preview: '',
          isValid: false,
          errorMessage: validation.errorMessage
        };
        this.setDniFile(side, dniFile);
        this.showValidationError(validation.errorMessage!);
      }
    } catch (error) {
      this.logger.error('Error processing file:', error);
      this.notificationService.error('Error al procesar el archivo');
    }
  }

  private createFilePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): ValidationResult {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
        return {
          isValid: false,
          errorMessage: 'Solo se permiten archivos JPEG, PNG y WebP'
        };
      }
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `El archivo no puede superar los ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      };
    }
    return { isValid: true };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private setDniFile(side: 'front' | 'back', dniFile: DniUploadFile): void {
    // Clean up previous preview URL
    const currentFile = side === 'front' ? this.frontDni() : this.backDni();
    if (currentFile?.preview && currentFile.preview.startsWith('blob:')) {
      URL.revokeObjectURL(currentFile.preview);
    }

    if (side === 'front') {
      this.frontDni.set(dniFile);
    } else {
      this.backDni.set(dniFile);
    }
  }

  removeFile(side: 'front' | 'back'): void {
    const currentFile = side === 'front' ? this.frontDni() : this.backDni();
    if (currentFile?.preview && currentFile.preview.startsWith('blob:')) {
      URL.revokeObjectURL(currentFile.preview);
    }

    if (side === 'front') {
      this.frontDni.set(null);
    } else {
      this.backDni.set(null);
    }
  }

  // Form Submission
  onSubmit(): void {
    if (!this.canSubmit()) {
      this.showValidationError('Por favor selecciona ambas imágenes del DNI válidas');
      return;
    }

    this.isSubmitting.set(true);
    
    const frontFile = this.frontDni()!.file;
    const backFile = this.backDni()!.file;

    this.userService.verifyDni(frontFile, backFile)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          this.handleUploadSuccess(response);
        },
        error: (error) => {
          this.handleUploadError(error);
        }
      });
  }

  private handleUploadSuccess(response: any): void {
    this.logger.debug('DNI upload successful:', response);
    
    this.notificationService.success('DNI verificado correctamente', {
      duration: 5000,
      action: {
        label: 'Ver detalles',
        action: () => this.showUploadDetails(response)
      }
    });

    this.uploadSuccess.emit({
      success: true,
      data: response,
      message: 'DNI verificado correctamente'
    });

    this.resetForm();
  }

  private handleUploadError(error: any): void {
    this.logger.error('DNI upload error:', error);
    
    const errorMessage = this.getErrorMessage(error);
    
    this.notificationService.error('Error al verificar el DNI', {
      duration: 7000,
      action: {
        label: 'Reintentar',
        action: () => this.onSubmit()
      }
    });

    this.uploadError.emit(errorMessage);
  }

  private getErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          return error.error?.detail || 'Datos inválidos en la solicitud';
        case 413:
          return 'Los archivos son demasiado grandes';
        case 422:
          return error.error?.detail || 'Error de validación en los archivos';
        case 429:
          return 'Demasiadas solicitudes. Espera un momento antes de reintentar';
        case 500:
          return 'Error del servidor. Inténtalo más tarde';
        case 503:
          return 'Servicio no disponible temporalmente';
        default:
          return error.error?.message || 'Error inesperado del servidor';
      }
    }
    
    if (error.name === 'TimeoutError') {
      return 'Tiempo de espera agotado. Verifica tu conexión';
    }

    return 'Error al procesar la solicitud. Inténtalo nuevamente';
  }

  // Utility Methods
  private showValidationError(message: string): void {
    this.notificationService.warning(message, { duration: 5000 });
  }

  private showUploadDetails(response: any): void {
    // Implementation for showing upload details
    this.logger.debug('Upload details:', response);
  }

  private resetForm(): void {
    this.cleanupPreviews();
    this.frontDni.set(null);
    this.backDni.set(null);
    this.isDraggingFront.set(false);
    this.isDraggingBack.set(false);
  }

  private cleanupPreviews(): void {
    [this.frontDni(), this.backDni()].forEach(file => {
      if (file?.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
  }

  // Public Methods for Template
  triggerFileInput(side: 'front' | 'back'): void {
    const input = document.getElementById(`${side}-file-input`) as HTMLInputElement;
    input?.click();
  }

  getFileSize(file: DniUploadFile | null): string {
    return file ? this.formatFileSize(file.file.size) : '';
  }

  retryUpload(): void {
    if (this.canSubmit()) {
      this.onSubmit();
    }
  }

  onKeydown(event: KeyboardEvent, side: 'front' | 'back'): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.triggerFileInput(side);
    }
  }
}