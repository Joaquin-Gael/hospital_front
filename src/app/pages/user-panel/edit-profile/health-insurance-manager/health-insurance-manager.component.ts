import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HealthInsuranceRead } from '../../../../services/interfaces/health-insurance.interfaces';
import { LoggerService } from '../../../../services/core/logger.service';

@Component({
  selector: 'app-health-insurance-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-insurance-manager.component.html',
  styleUrls: ['./health-insurance-manager.component.scss']
})
export class HealthInsuranceManagerComponent implements OnChanges {
  private readonly logger = inject(LoggerService);

  @Input() availableInsurances: HealthInsuranceRead[] = [];
  @Input() selectedInsurances: HealthInsuranceRead[] = [];
  @Output() insurancesChanged = new EventEmitter<{ available: HealthInsuranceRead[], selected: HealthInsuranceRead[] }>();
  @Output() saveInsurances = new EventEmitter<string[]>();

  private draggedInsurance: HealthInsuranceRead | null = null;
  isDraggingOver = false;
  private initialSelectedIds: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedInsurances'] && this.selectedInsurances) {
      this.initialSelectedIds = this.selectedInsurances.map(ins => ins.id);
    }
  }

  get hasChanges(): boolean {
    const currentIds = this.selectedInsurances.map(ins => ins.id).sort();
    const initialIds = [...this.initialSelectedIds].sort();
    
    if (currentIds.length !== initialIds.length) return true;
    
    return currentIds.some((id, index) => id !== initialIds[index]);
  }

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
      this.addToSelected(this.draggedInsurance);
      this.draggedInsurance = null;
    }
  }

  onDropToAvailable(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;

    if (this.draggedInsurance) {
      this.removeFromSelected(this.draggedInsurance);
      this.draggedInsurance = null;
    }
  }

  addToSelected(insurance: HealthInsuranceRead): void {
    const newSelected = [...this.selectedInsurances, insurance];
    const newAvailable = this.availableInsurances.filter(ins => ins.id !== insurance.id);
    
    this.emitChanges(newAvailable, newSelected);
  }

  removeFromSelected(insurance: HealthInsuranceRead): void {
    const newSelected = this.selectedInsurances.filter(ins => ins.id !== insurance.id);
    const newAvailable = [...this.availableInsurances, insurance];
    
    this.emitChanges(newAvailable, newSelected);
  }

  private emitChanges(available: HealthInsuranceRead[], selected: HealthInsuranceRead[]): void {
    this.insurancesChanged.emit({ available, selected });
  }

  onSave(): void {
    const selectedIds = this.selectedInsurances.map(insurance => insurance.id);
    this.saveInsurances.emit(selectedIds);
    
    // Update initial state after save
    this.initialSelectedIds = [...selectedIds];
  }
}