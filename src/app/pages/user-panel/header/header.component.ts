import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent implements OnInit {
  @Output() newAppointment = new EventEmitter<void>();
  @Output() editProfile = new EventEmitter<void>();

  activeSection: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setActiveSectionFromRoute();
  }

  private setActiveSectionFromRoute(): void {
    const url = this.router.url.toLowerCase();
    if (url.includes('appointments')) {
      this.activeSection = 'appointments';
    } else if (url.includes('history')) {
      this.activeSection = 'history';
    } else if (url.includes('notifications')) {
      this.activeSection = 'notifications';
    } else if (url.includes('documents')) {
      this.activeSection = 'documents';
    } else if (url.includes('profile')) {
      this.activeSection = 'profile';
    } else {
      this.activeSection = 'appointments';
    }
  }

  requestNewAppointment(): void {
    this.newAppointment.emit();
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }
}