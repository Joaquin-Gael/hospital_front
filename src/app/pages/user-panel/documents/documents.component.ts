import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../models/models';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DocumentsComponent {
  @Input() documents: Document[] = [];

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}