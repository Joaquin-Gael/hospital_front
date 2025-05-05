import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../models/user.model';
//import { EditProfileComponent } from '../edit-profile/edit-profile.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ProfileComponent implements OnChanges {
  @Input() user: User | null = null;
  @Output() editProfile = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      console.log('ProfileComponent received user:', this.user); // Depuración
    }
  }

  get bloodType(): string {
    return 'O+'; // Esto debería venir del backend
  }

  get insurance(): string {
    return 'OSDE'; // Esto debería venir del backend
  }

  get lastVisit(): Date | null {
    return new Date('2025-04-15'); // Esto debería venir del backend
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

  onChangePassword(): void {
    this.changePassword.emit();
  }
}
