import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T extends Record<string, any> & HasIsActive> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() searchEnabled = true;
  @Input() pagination = true;
  @Input() showBanUnban = false;

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() view = new EventEmitter<T>();
  @Output() ban = new EventEmitter<T>();
  @Output() unban = new EventEmitter<T>();

  searchTerm = signal<string>('');
  currentPage = 1;
  itemsPerPage = 10;

  get filteredData(): T[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.data;

    return this.data.filter((item) =>
      Object.values(item).some(
        (value) =>
          value != null && value.toString().toLowerCase().includes(term)
      )
    );
  }

  get paginatedData(): T[] {
    if (!this.pagination) return this.filteredData;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input?.value ?? '');
  }

  onEdit(item: T): void {
    this.edit.emit(item);
  }

  onDelete(item: T): void {
    this.delete.emit(item);
  }

  onView(item: T): void {
    this.view.emit(item);
  }

  onBan(item: T): void {
    this.ban.emit(item);
  }

  onUnban(item: T): void {
    this.unban.emit(item);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
