import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="newsletter-section">
      <div class="newsletter-content">
        <div class="newsletter-info">
          <h2>Boletín Informativo</h2>
          <p>Suscríbase para recibir información sobre campañas de salud, nuevos servicios y consejos médicos</p>
        </div>
        <div class="newsletter-form">
          <div class="form-group">
            <input 
              type="email" 
              [(ngModel)]="email" 
              placeholder="Su correo electrónico" 
              aria-label="Correo electrónico para boletín"
            >
            <button (click)="submitNewsletter()">
              <span class="material-icons">send</span>
            </button>
          </div>
          <p class="privacy-note">Al suscribirse, acepta nuestra <a href="#">Política de Privacidad</a></p>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent {
  email = '';

  submitNewsletter() {
    if (this.email && this.validateEmail(this.email)) {
      console.log('Email submitted:', this.email);
      this.email = '';
      alert('¡Gracias por suscribirte a nuestro boletín informativo!');
    } else {
      alert('Por favor, introduce un email válido');
    }
  }

  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }
}