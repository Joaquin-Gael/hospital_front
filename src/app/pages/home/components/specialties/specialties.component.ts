import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Specialty {
  id: number;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-specialties',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="specialties-section">
      <div class="section-header">
        <h2>Especialidades Médicas</h2>
        <p class="section-description">Contamos con especialistas en todas las áreas de la medicina para brindarle la mejor atención</p>
      </div>
      
      <div class="specialties-grid">
        <div class="specialty-card" *ngFor="let specialty of specialties">
          <div class="specialty-icon">
            <span class="material-icons">{{specialty.icon}}</span>
          </div>
          <h3>{{specialty.name}}</h3>
          <p>{{specialty.description}}</p>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./specialties.component.scss']
})
export class SpecialtiesComponent {
  @Input() specialties: Specialty[] = [];
}