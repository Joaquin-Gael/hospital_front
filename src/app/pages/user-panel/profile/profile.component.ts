import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../models/user.model'; 

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfileComponent {
  @Input() user: User | null = null;
  @Output() editProfile = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<void>();

  get fullName(): string {
    if (!this.user) return 'No disponible';
    return `${this.user.first_name} ${this.user.last_name}`.trim() || 'No disponible';
  }

  get phone(): string {
    return this.user?.telephone || 'No especificado';
  }

  get birthDate(): Date {
    if (!this.user) return new Date();
    return new Date(this.user.date_joined); 
  }

  get bloodType(): string {
    return 'O+'; 
  }

  get address(): string {
    return 'Av. Siempre Viva 123, Springfield';
  }

  get insurance(): string {
    return 'OSDE'; 
  }

  get lastVisit(): Date | null {
    return new Date('2025-04-15');
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No registrada';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    if (!name || name === 'No disponible') return 'ND';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onChangePassword(): void {
    this.changePassword.emit();
  }
}