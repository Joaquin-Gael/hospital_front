import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface News {
  id: number;
  title: string;
  date: string;
  summary: string;
  image: string;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="news-section"
      [attr.aria-labelledby]="headingId"
    >
      <div class="section-header">
        <h2 [attr.id]="headingId">Noticias y Eventos</h2>
        <p class="section-description">Mantente informado sobre las últimas novedades de nuestro hospital</p>
      </div>
      
      <div class="news-grid">
        <div class="news-card" *ngFor="let item of news">
          <div class="news-image">
            <div class="image-placeholder"></div>
          </div>
          <div class="news-content">
            <span class="news-date">{{item.date}}</span>
            <h3>{{item.title}}</h3>
            <p>{{item.summary}}</p>
            <a href="#" class="news-link">Leer más</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./news.component.scss']
})
export class NewsComponent {
  @Input() news: News[] = [];
  @Input() headingId = 'home-news-heading';
}
