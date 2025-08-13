import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="steps-indicator">
      <div class="steps-track">
        <div
          class="steps-progress"
          [style.width.%]="(currentStep / totalSteps) * 100"
        ></div>
      </div>
      <div class="steps-circles">
        <div
          *ngFor="let step of [1, 2, 3, 4]; let i = index"
          class="step-circle"
          [class.active]="currentStep >= step"
          [class.completed]="currentStep > step"
          (click)="onStepClick(step)"
          [attr.aria-label]="'Ir al paso ' + step"
        >
          <span class="step-number" *ngIf="currentStep <= step">{{ step }}</span>
          <i *ngIf="currentStep > step" class="material-icons step-check">check</i>
        </div>
      </div>
      <div class="steps-labels">
        <span class="step-label">Servicio</span>
        <span class="step-label">Fecha</span>
        <span class="step-label">Hora</span>
        <span class="step-label">Motivo y Pago</span>
      </div>
    </div>
  `,
  styleUrl: './step-indicator.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class StepIndicatorComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 4;
  @Output() stepChange = new EventEmitter<number>();

  onStepClick(step: number): void {
    this.stepChange.emit(step);
  }
}