import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="cta-section"
      [attr.aria-labelledby]="headingId"
    >
      <div class="cta-content">
        <h2 [attr.id]="headingId">Su Salud es Nuestra Prioridad</h2>
        <p>Agende una cita con nuestros especialistas y experimente atención médica de excelencia</p>
        <div class="cta-buttons">
          <button class="btn-primary">
            <span class="material-icons">event</span>
            Agendar Cita
          </button>
          <button class="btn-outline">
            <span class="material-icons">phone</span>
            Contactar
          </button>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./cta.component.scss']
})
export class CtaComponent {
  @Input() headingId = 'home-cta-heading';
}
