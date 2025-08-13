import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-navigation-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-navigation">
      <button
        type="button"
        class="nav-button back-button"
        *ngIf="currentStep > 1"
        (click)="onBackClick()"
        [disabled]="isLoading"
        aria-label="Volver al paso anterior"
      >
        <i class="material-icons">arrow_back</i>
        Atrás
      </button>

      <button
        *ngIf="currentStep < totalSteps"
        type="button"
        class="nav-button next-button"
        (click)="onNextClick()"
        [disabled]="!isStepValid || isLoading"
        aria-label="Continuar al siguiente paso"
        [@pulse]="buttonState"
        (mouseenter)="onButtonHover(true)"
        (mouseleave)="onButtonHover(false)"
      >
        Continuar
        <i class="material-icons">arrow_forward</i>
      </button>

      <button
        *ngIf="currentStep === totalSteps"
        type="submit"
        class="nav-button payment-button"
        [disabled]="!isFormValid || isLoading"
        aria-label="Confirmar turno"
        [@pulse]="buttonState"
        (mouseenter)="onButtonHover(true)"
        (mouseleave)="onButtonHover(false)"
        (click)="onSubmitClick()"
      >
        <span *ngIf="!isLoading" class="button-content">
          <i class="material-icons">check_circle</i>
          Confirmar turno
        </span>
        <span *ngIf="isLoading" class="button-loading">
          <i class="material-icons loading-spinner">hourglass_empty</i>
          Procesando...
        </span>
      </button>
    </div>
  `,
  styleUrl: './navigation-buttons.component.scss',
  animations: [
    trigger('pulse', [
      state('inactive', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.05)' })),
      transition('inactive => active', animate('300ms ease-in')),
      transition('active => inactive', animate('300ms ease-out'))
    ])
  ]
})
export class NavigationButtonsComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 4;
  @Input() isStepValid = false;
  @Input() isFormValid = false;
  @Input() isLoading = false;
  @Input() buttonState = 'inactive';

  @Output() backClick = new EventEmitter<void>();
  @Output() nextClick = new EventEmitter<void>();
  @Output() submitClick = new EventEmitter<void>();
  @Output() buttonHover = new EventEmitter<boolean>();

  onBackClick(): void {
    this.backClick.emit();
  }

  onNextClick(): void {
    this.nextClick.emit();
  }

  onSubmitClick(): void {
    this.submitClick.emit();
  }

  onButtonHover(isHovering: boolean): void {
    this.buttonHover.emit(isHovering);
  }
}