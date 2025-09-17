import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';

@Component({
  selector: 'app-code-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="code-verification">
      <div class="code-verification__header">
        <div class="code-verification__icon">
          <i class="fas fa-key"></i>
        </div>
        <h2 class="code-verification__title">Verificar código</h2>
        <p class="code-verification__description">
          Ingresa el código de {{ codeLength }} dígitos que enviamos a tu {{ methodName }}
        </p>
      </div>

      <form [formGroup]="verificationForm" (ngSubmit)="onVerifyCode()" novalidate>
        <div class="form-field">
          <label class="form-field__label">
            Código de verificación
            <span class="form-field__required">*</span>
          </label>
          <div class="code-input">
            @for (digit of codeDigits; track $index) {
              <input
                type="text"
                class="code-input__digit"
                [class.code-input__digit--error]="hasError"
                maxlength="1"
                autocomplete="one-time-code"
                [formControlName]="'digit' + $index"
                (input)="onDigitInput($event, $index)"
                (keydown)="onDigitKeydown($event, $index)"
                (paste)="onCodePaste($event, $index)"
                #digitInput
              />
            }
          </div>
          @if (hasError) {
            <div class="form-field__error">
              <i class="fas fa-exclamation-triangle"></i>
              {{ errorMessage }}
            </div>
          }
        </div>

        <div class="verification-timer">
          @if (timeLeft > 0) {
            <div class="verification-timer__countdown">
              <i class="fas fa-clock"></i>
              <span>Puedes solicitar un nuevo código en {{ formatTime(timeLeft) }}</span>
            </div>
          } @else {
            <button 
              type="button"
              class="verification-timer__resend"
              [disabled]="isResending"
              (click)="onResendCode()"
            >
              @if (isResending) {
                <i class="fas fa-spinner fa-spin"></i>
              } @else {
                <i class="fas fa-redo"></i>
              }
              Reenviar código
            </button>
          }
        </div>

        <div class="form-actions">
          <button 
            type="button"
            class="btn btn--outline"
            [disabled]="isLoading"
            (click)="onGoBack()"
          >
            <i class="fas fa-arrow-left"></i>
            Atrás
          </button>
          
          <button 
            type="submit"
            class="btn btn--primary"
            [disabled]="verificationForm.invalid || isLoading"
          >
            @if (isLoading) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-check"></i>
            }
            {{ isLoading ? 'Verificando...' : 'Verificar código' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./code-verification.component.scss']
})
export class CodeVerificationComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @Input() methodName!: string;
  @Input() isLoading = false;
  @Input() isResending = false;
  @Input() codeLength = 6;
  
  @Output() codeVerified = new EventEmitter<string>();
  @Output() resendCode = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();

  verificationForm!: FormGroup;
  codeDigits: string[] = [];
  hasError = false;
  errorMessage = '';
  timeLeft = 0;

  ngOnInit(): void {
    this.initializeForm();
    this.startTimer(60); // Start with 60 seconds
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const digitControls: { [key: string]: FormControl } = {};
    this.codeDigits = new Array(this.codeLength).fill('');
    
    for (let i = 0; i < this.codeLength; i++) {
      digitControls[`digit${i}`] = new FormControl('', [
        Validators.required, 
        Validators.pattern(/^\d$/)
      ]);
    }
    this.verificationForm = this.fb.group(digitControls);
  }

  onDigitInput(event: any, index: number): void {
    const value = event.target.value;
    const digitKey = `digit${index}`;
    
    if (value && /^\d$/.test(value)) {
      this.verificationForm.get(digitKey)?.setValue(value);
      this.codeDigits[index] = value;
      
      // Auto-focus next input
      if (index < this.codeLength - 1) {
        const nextInput = event.target.parentElement.children[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else {
      this.verificationForm.get(digitKey)?.setValue('');
      this.codeDigits[index] = '';
    }

    this.hasError = false;
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    const target = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !target.value && index > 0) {
      const prevInput = target.parentElement!.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
        this.verificationForm.get(`digit${index - 1}`)?.setValue('');
        this.codeDigits[index - 1] = '';
      }
    }
  }

  onCodePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, this.codeLength);

    digits.split('').forEach((digit, i) => {
      if (i < this.codeLength) {
        this.verificationForm.get(`digit${i}`)?.setValue(digit);
        this.codeDigits[i] = digit;
        
        const input = (event.target as HTMLElement).parentElement!.children[i] as HTMLInputElement;
        if (input) {
          input.value = digit;
        }
      }
    });

    const nextIndex = Math.min(digits.length, this.codeLength - 1);
    const nextInput = (event.target as HTMLElement).parentElement!.children[nextIndex] as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  }

  onVerifyCode(): void {
    if (this.verificationForm.invalid || this.isLoading) return;

    const code = this.codeDigits.join('');
    this.codeVerified.emit(code);
  }

  onResendCode(): void {
    this.resendCode.emit();
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  setError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.verificationForm.reset();
    this.codeDigits.fill('');
  }

  private startTimer(seconds: number): void {
    this.timeLeft = seconds;
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        }
      });
  }

  resetTimer(seconds: number = 60): void {
    this.startTimer(seconds);
    this.hasError = false;
    this.verificationForm.reset();
    this.codeDigits.fill('');
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}