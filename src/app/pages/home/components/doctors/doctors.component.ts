import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  description: string;
  rating: number;
  avatar: string;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="testimonials-section">
      <div class="section-header">
        <h2>Nuestros Especialistas</h2>
        <p class="section-description">Contamos con un equipo médico de excelencia comprometido con tu salud</p>
      </div>
      
      <div class="testimonials-container">
        <div class="testimonial-card" *ngFor="let doctor of doctors; let i = index" [class.active]="i === currentDoctorIndex">
          <div class="testimonial-content">
            <blockquote>
              <p>"{{doctor.description}}"</p>
            </blockquote>
            <div class="testimonial-rating">
              <span class="material-icons star" *ngFor="let star of getStars(doctor.rating)">star</span>
            </div>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">
              <span class="material-icons">{{doctor.avatar}}</span>
            </div>
            <div class="author-info">
              <h4>{{doctor.name}}</h4>
              <p>{{doctor.specialty}}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="testimonial-dots">
        <span 
          class="dot" 
          *ngFor="let doctor of doctors; let i = index" 
          [class.active]="i === currentDoctorIndex"
          (click)="currentDoctorIndex = i">
        </span>
      </div>
    </section>
  `,
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit, OnDestroy {
  @Input() doctors: Doctor[] = [];
  currentDoctorIndex = 0;
  private intervalId?: number;

  ngOnInit() {
    this.startDoctorRotation();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startDoctorRotation() {
    this.intervalId = window.setInterval(() => {
      this.currentDoctorIndex = (this.currentDoctorIndex + 1) % this.doctors.length;
    }, 8000);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}