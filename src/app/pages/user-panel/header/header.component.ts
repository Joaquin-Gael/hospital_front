import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent {
  @Input() activeSection: string = 'appointments';
  @Output() newAppointment = new EventEmitter<void>();
  @Output() editProfile = new EventEmitter<void>();

  requestNewAppointment(): void {
    this.newAppointment.emit();
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }
}