import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ViewDialogData {
  item: any;
  columns: { key: string; label: string; format?: (value: any) => string }[];
}

@Component({
  selector: 'app-view-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h2 mat-dialog-title>Detalles</h2>
    <mat-dialog-content>
      <table>
        <tr *ngFor="let column of data.columns">
          <td>{{ column.label }}</td>
          <td>{{ column.format ? column.format(data.item[column.key]) : (data.item[column.key] || 'N/A') }}</td>
        </tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="dialogRef.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    td:first-child {
      font-weight: bold;
    }
  `]
})
export class ViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewDialogData
  ) {}
}