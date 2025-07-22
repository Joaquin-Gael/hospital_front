import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="faq-section">
      <div class="section-header">
        <h2>Preguntas Frecuentes</h2>
        <p class="section-description">Respuestas a las consultas más comunes sobre nuestros servicios</p>
      </div>
      
      <div class="faq-container">
        <div class="faq-item" *ngFor="let faq of faqs">
          <div class="faq-question" (click)="toggleFaq(faq)">
            <h3>{{faq.question}}</h3>
            <span class="material-icons">{{faq.isOpen ? 'remove' : 'add'}}</span>
          </div>
          <div class="faq-answer" [@expandCollapse]="faq.isOpen ? 'expanded' : 'collapsed'">
            <p>{{faq.answer}}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./faq.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class FaqComponent {
  @Input() faqs: FAQ[] = [];

  toggleFaq(faq: FAQ) {
    faq.isOpen = !faq.isOpen;
  }
}