import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoggerService } from '../../../../services/core/logger.service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss']
})
export class ProfileFormComponent implements AfterViewInit, OnInit {
  ngAfterViewInit(): void {
    // Implement required AfterViewInit interface method
  }
  private readonly fb = inject(FormBuilder);
  private readonly logger = inject(LoggerService);
   
  loading: boolean = true;
  @Input() initialData: any = null;
  @Input() isSubmitting: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm!: FormGroup;
  selectedFile: File | null = null;
  currentPhotoUrl: string | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, [Validators.required]],
      first_name: [{ value: '', disabled: true }, [Validators.required]],
      last_name: [{ value: '', disabled: true }, [Validators.required]],
      address: ['', [Validators.maxLength(255)]],
      telephone: ['', [Validators.pattern(/^\+?\d{9,15}$/)]],
    });
  }

  private loadInitialData(): void {
    if (this.initialData) {
      this.profileForm.patchValue({
        username: this.initialData.username || '',
        first_name: this.initialData.first_name || '',
        last_name: this.initialData.last_name || '',
        address: this.initialData.address || '',
        telephone: this.initialData.telephone || '',
      });

      if (this.initialData.img_profile) {
        this.currentPhotoUrl = this.initialData.img_profile;
      }
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file
      if (!this.validateFile(file)) {
        return;
      }

      this.selectedFile = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentPhotoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private validateFile(file: File): boolean {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.logger.error('Tipo de archivo no válido. Solo se permiten JPG y PNG.');
      return false;
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.logger.error('El archivo es demasiado grande. Máximo 2MB.');
      return false;
    }

    return true;
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.currentPhotoUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const formData = {
        ...this.profileForm.value,
        img_profile: this.selectedFile
      };
      
      this.formSubmit.emit(formData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (control.errors['maxlength']) {
        return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Formato de teléfono inválido';
      }
    }
    return '';
  }
}