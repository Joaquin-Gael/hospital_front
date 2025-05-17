import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRead } from '../../../services/interfaces/user.interfaces';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfileComponent implements OnChanges {
  @Input() user: UserRead | null = null;
  @Output() editProfile = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      console.log('ProfileComponent: Usuario recibido:', this.user);
    }
  }

  get insurance(): string {
    return 'OSDE'; // TODO: Obtener del backend
  }

  get lastVisit(): Date | null {
    return new Date('2025-04-15'); // TODO: Obtener del backend
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No registrada';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(): string {
    const name = this.user ? `${this.user.first_name} ${this.user.last_name}`.trim() : '';
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