import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-indicator.component.html',
  styleUrls: ['./step-indicator.component.scss'],
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

  get stepsArray(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
  }

  onStepClick(step: number): void {
    this.stepChange.emit(step);
  }
}