import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() actions: ActionButton[] = [];
}