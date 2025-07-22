import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Department {
  id: number;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="services-section" aria-labelledby="services-heading">
      <div class="section-header">
        <h2 id="services-heading">Nuestros Servicios</h2>
        <p class="section-description">Ofrecemos una amplia gama de servicios médicos con los más altos estándares de calidad</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-card" *ngFor="let department of departments">
          <div class="feature-icon">
            <span class="material-icons">{{department.icon}}</span>
          </div>
          <div class="feature-content">
            <h3>{{department.name}}</h3>
            <p>{{department.description}}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  @Input() departments: Department[] = [];
}