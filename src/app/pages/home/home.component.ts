import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { HeroComponent } from './components/hero/hero.component';
import { StatsComponent } from './components/stats/stats.component';
import { ServicesComponent } from './components/services/services.component';
import { SpecialtiesComponent } from './components/specialties/specialties.component';
import { ServiceTabsComponent } from './components/service-tabs/service-tabs.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { NewsComponent } from './components/news/news.component';
import { FaqComponent } from './components/faq/faq.component';
import { CtaComponent } from './components/cta/cta.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';

// Data
import { DEPARTMENTS, DOCTORS, NEWS, FAQS, SPECIALTIES, STATS, HERO } from './data/hospital-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroComponent,
    StatsComponent,
    ServicesComponent,
    SpecialtiesComponent,
    ServiceTabsComponent,
    NewsComponent,
    FaqComponent,
    CtaComponent,
  ]
})
export class HomeComponent {
  departments = DEPARTMENTS;
  doctors = DOCTORS;
  news = NEWS;
  faqs = FAQS;
  specialties = SPECIALTIES;
  stats = STATS;
  hero = HERO;
}