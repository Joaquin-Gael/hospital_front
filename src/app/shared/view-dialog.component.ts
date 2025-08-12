import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ViewDialogData {
  item: any;
  columns: { key: string; label: string; format?: (value: any) => string }[];
  title?: string;
}

@Component({
  selector: 'app-view-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <div class="view-dialog">
      <div class="view-dialog__header">
        <h2>{{ data.title || 'Detalles del Elemento' }}</h2>
      </div>
      
      <div class="view-dialog__content">
        <table class="view-dialog__table">
          <tr *ngFor="let column of data.columns">
            <td>{{ column.label }}</td>
            <td>
              <ng-container [ngSwitch]="getValueType(column, data.item[column.key])">
                <!-- Imagen -->
                <img *ngSwitchCase="'image'" 
                     [src]="data.item[column.key]" 
                     [alt]="column.label"
                     class="view-dialog__image"
                     (error)="handleImageError($event)" />
                
                <!-- Email -->
                <a *ngSwitchCase="'email'"
                   [href]="'mailto:' + data.item[column.key]"
                   class="view-dialog__link">
                  {{ data.item[column.key] }}
                </a>
                
                <!-- Teléfono -->
                <a *ngSwitchCase="'phone'"
                   [href]="'tel:' + data.item[column.key]"
                   class="view-dialog__link">
                  {{ data.item[column.key] }}
                </a>
                
                <!-- Boolean con badges -->
                <span *ngSwitchCase="'boolean'"
                      [class]="getBooleanBadgeClass(data.item[column.key])">
                  {{ data.item[column.key] ? 'Sí' : 'No' }}
                </span>
                
                <!-- Fecha -->
                <span *ngSwitchCase="'date'">
                  {{ formatDate(data.item[column.key]) }}
                </span>
                
                <!-- Valor por defecto -->
                <span *ngSwitchDefault 
                      [class.view-dialog__empty-value]="!getValue(column, data.item[column.key])">
                  {{ getValue(column, data.item[column.key]) || 'No disponible' }}
                </span>
              </ng-container>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="view-dialog__actions">
        <button type="button" 
                class="view-dialog__close-button" 
                (click)="dialogRef.close()"
                aria-label="Cerrar diálogo">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./view-dialog.component.scss']
})
export class ViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewDialogData
  ) {}

  getValueType(column: any, value: any): string {
    if (!value) return 'default';
    
    // Detectar imagen por la key o por la extensión
    if (column.key === 'img_profile' || column.key.includes('image') || 
        (typeof value === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value))) {
      return 'image';
    }
    
    // Detectar email
    if (column.key === 'email' || (typeof value === 'string' && value.includes('@'))) {
      return 'email';
    }
    
    // Detectar teléfono
    if (column.key === 'telephone' || column.key === 'phone' || 
        (typeof value === 'string' && /^[\+\d\s\-\(\)]+$/.test(value))) {
      return 'phone';
    }
    
    // Detectar boolean
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    // Detectar fecha
    if (column.key.includes('date') || column.key.includes('time') ||
        (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value))) {
      return 'date';
    }
    
    return 'default';
  }

  getValue(column: any, value: any): string {
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