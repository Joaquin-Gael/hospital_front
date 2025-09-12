import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
  @Input() closeAriaLabel: string = 'Cerrar mensaje de error';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}