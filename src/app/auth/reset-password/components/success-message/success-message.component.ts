import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-message">
      <div class="success-message__icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2 class="success-message__title">¡Contraseña restablecida con éxito!</h2>
      <p class="success-message__description">
        Tu contraseña ha sido actualizada correctamente. 
        @if (sessionsClosed) {
          También hemos cerrado las sesiones activas en otros dispositivos por seguridad.
        }
      </p>
      
      <div class="success-actions">
        <button 
          type="button"
          class="btn btn--primary"
          (click)="onGoToProfile()"
        >
          <i class="fas fa-user"></i>
          Ir al perfil
        </button>
        
        <button 
          type="button"
          class="btn btn--outline"
          (click)="onGoToDashboard()"
        >
          <i class="fas fa-home"></i>
          Ir al inicio
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./success-message.component.scss']
})
export class SuccessMessageComponent {
  @Input() sessionsClosed = false;
  
  @Output() goToProfile = new EventEmitter<void>();
  @Output() goToDashboard = new EventEmitter<void>();

  onGoToProfile(): void {
    this.goToProfile.emit();
  }

  onGoToDashboard(): void {
    this.goToDashboard.emit();
  }
}