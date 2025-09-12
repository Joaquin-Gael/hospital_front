import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ViewDialogColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

@Component({
  selector: 'app-view-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-dialog-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="view-dialog" (click)="$event.stopPropagation()">
        <div class="view-dialog__header">
          <h2>{{ title || 'Detalles del Elemento' }}</h2>
        </div>
        
        <div class="view-dialog__content">
          <table class="view-dialog__table">
            @for (column of columns; track column.key) {
              <tr>
                <td class="view-dialog__label">{{ column.label }}</td>
                <td class="view-dialog__value">
                  @switch (getValueType(column, item[column.key])) {
                    @case ('image') {
                      <img 
                        [src]="item[column.key]" 
                        [alt]="column.label"
                        class="view-dialog__image"
                        (error)="handleImageError($event)" />
                    }
                    @case ('email') {
                      <a [href]="'mailto:' + item[column.key]" class="view-dialog__link">
                        {{ item[column.key] }}
                      </a>
                    }
                    @case ('phone') {
                      <a [href]="'tel:' + item[column.key]" class="view-dialog__link">
                        {{ item[column.key] }}
                      </a>
                    }
                    @case ('boolean') {
                      <span [class]="getBooleanBadgeClass(item[column.key])">
                        {{ item[column.key] ? 'Sí' : 'No' }}
                      </span>
                    }
                    @case ('date') {
                      <span>{{ formatDate(item[column.key]) }}</span>
                    }
                    @default {
                      <span 
                        [class.view-dialog__empty-value]="!getValue(column, item[column.key])">
                        {{ getValue(column, item[column.key]) || 'No disponible' }}
                      </span>
                    }
                  }
                </td>
              </tr>
            }
          </table>
        </div>
        
        <div class="view-dialog__actions">
          <button 
            type="button" 
            class="view-dialog__close-button" 
            (click)="onClose()"
            aria-label="Cerrar diálogo">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./view-dialog.component.scss']
})
export class ViewDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() item: any = {};
  @Input() columns: ViewDialogColumn[] = [];
  @Input() title?: string;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getValueType(column: ViewDialogColumn, value: any): string {
    if (!value) return 'default';
    
    if (column.key === 'img_profile' || column.key.includes('image') || 
        (typeof value === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value))) {
      return 'image';
    }
    
    if (column.key === 'email' || (typeof value === 'string' && value.includes('@'))) {
      return 'email';
    }
    
    if (column.key === 'telephone' || column.key === 'phone' || 
        (typeof value === 'string' && /^[\+\d\s\-\(\)]+$/.test(value))) {
      return 'phone';
    }
    
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    if (column.key.includes('date') || column.key.includes('time') ||
        (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value))) {
      return 'date';
    }
    
    return 'default';
  }

  getValue(column: ViewDialogColumn, value: any): string {
    if (column.format) {
      return column.format(value);
    }
    return value;
  }

  getBooleanBadgeClass(value: boolean): string {
    const baseClass = 'view-dialog__badge';
    return value ? `${baseClass} ${baseClass}--success` : `${baseClass} ${baseClass}--error`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<span class="view-dialog__empty-value">Imagen no disponible</span>';
    }
  }
}