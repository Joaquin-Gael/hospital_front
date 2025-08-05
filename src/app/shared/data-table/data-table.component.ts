import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ViewDialogComponent } from '../view-dialog.component';

export interface TableColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface HasIsActive {
  is_active?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T extends Record<string, any> & HasIsActive> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading: boolean = false;
  @Input() searchEnabled: boolean = true;
  @Input() pagination: boolean = true;
  @Input() showBanUnban: boolean = false; // Nueva propiedad para controlar ban/unban

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() view = new EventEmitter<T>();
  @Output() ban = new EventEmitter<T>();
  @Output() unban = new EventEmitter<T>();

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(public dialog: MatDialog) {}

  get filteredData(): T[] {
    if (!this.searchTerm.trim()) {
      return this.data;
    }

    return this.data.filter((item) =>
      Object.keys(item).some((key) => {
        const value = item[key];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(this.searchTerm.toLowerCase());
      })
    );
  }

  get paginatedData(): T[] {
    if (!this.pagination) return this.filteredData;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  onEdit(item: T): void {
    this.edit.emit(item);
  }

  onDelete(item: T): void {
    this.delete.emit(item);
  }

  onView(item: T): void {
    this.dialog.open(ViewDialogComponent, {
      width: '400px',
      data: { item: item, columns: this.columns }
    });
  }

  onBan(item: T): void {
    this.ban.emit(item);
  }

  onUnban(item: T): void {
    this.unban.emit(item);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }
}