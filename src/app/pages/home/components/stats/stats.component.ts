import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stat {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="stats-section"
      [attr.aria-labelledby]="headingId"
    >
      <header class="stats-header">
        <h2 [id]="headingId">{{ headingText }}</h2>
      </header>

      <div class="stats-container">
        <div class="stat-item" *ngFor="let stat of stats">
          <div class="stat-icon">
            <span class="material-icons">{{stat.icon}}</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{stat.value}}</span>
            <span class="stat-label">{{stat.label}}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {
  @Input() stats: Stat[] = [];
  @Input() headingId = 'home-stats-heading';
  @Input() headingText = 'Resultados destacados';
}
