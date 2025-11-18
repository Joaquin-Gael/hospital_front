import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionButton {
  label: string;
  icon: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  ariaLabel?: string;
  onClick: () => void;
}

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss']
})
export class SectionHeaderComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string; // Nuevo: icono para el header
  @Input() headerClass?: string; // Nuevo: clase de color para el header (ej: 'header-blue', 'header-indigo')
  @Input() actions: ActionButton[] = [];
}
