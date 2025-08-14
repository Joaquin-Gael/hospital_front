import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';

@Component({
  selector: 'app-health-insurance-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './health-insarunce-selection.component.html',
  styleUrls: ['./health-insarunce-selection.component.scss']
})
export class HealthInsuranceSelectionComponent {
  @Input() healthInsurances: HealthInsuranceRead[] = [];
  @Input() healthInsuranceControl!: FormControl;
  @Input() error: string | null = null;
  @Output() insuranceChange = new EventEmitter<string>();

  onInsuranceChange(insuranceId: string): void {
    this.insuranceChange.emit(insuranceId);
  }
}