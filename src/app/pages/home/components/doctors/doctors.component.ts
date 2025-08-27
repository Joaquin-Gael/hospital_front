import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
      
      <div class="testimonials-container" 
           [style.transform]="'translateX(-' + (currentSlideIndex * 0) + '%)'"
           [style.transition]="hasTransition ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'">
        <div class="testimonial-card" *ngFor="let doctor of slides; let i = index">
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
          [class.active]="i === realIndex"
          (click)="goToDoctor(i)">
        </span>
      </div>
    </section>
  `,
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit, OnDestroy {
  @Input() doctors: Doctor[] = [];
  slides: Doctor[] = [];
  currentSlideIndex = 1;
  realIndex = 0;
  hasTransition = true;
  private intervalId?: number;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.doctors.length > 0) {
      const last = this.doctors[this.doctors.length - 1];
      const first = this.doctors[0];
      this.slides = [last, ...this.doctors, first];
      this.currentSlideIndex = 1;
      this.realIndex = 0;
    }
    this.startDoctorRotation();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startDoctorRotation() {
    this.intervalId = window.setInterval(() => {
      this.nextSlide();
    }, 8000);
  }

  nextSlide() {
    this.currentSlideIndex++;
    this.cdr.detectChanges();

    if (this.currentSlideIndex === this.slides.length - 1) {
      setTimeout(() => {
        this.hasTransition = false;
        this.currentSlideIndex = 1;
        this.cdr.detectChanges();
        this.hasTransition = true;
      }, 600); // Tiempo de transición en ms
    }

    this.realIndex = (this.currentSlideIndex - 1) % this.doctors.length;
  }

  goToDoctor(index: number) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.currentSlideIndex = index + 1;
    this.realIndex = index;
    this.cdr.detectChanges();
    this.startDoctorRotation();
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}