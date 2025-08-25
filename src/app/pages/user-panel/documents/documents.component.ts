import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../interfaces/user-panel.interfaces';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DocumentsComponent {
  @Input() documents: Document[] = [];
  @Input() loading: boolean = false;

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  trackById(index: number, item: Document): string {
    return item.id;
  }
}