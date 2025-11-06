import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends Record<string, any> & HasIsActive> {
  private readonly _data = signal<T[]>([]);
  private readonly _columns = signal<TableColumn[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _searchEnabled = signal<boolean>(true);
  private readonly _pagination = signal<boolean>(true);
  private readonly _showBanUnban = signal<boolean>(false);

  @Input({ required: true })
  set data(value: T[] | undefined | null) {
    this._data.set(value ?? []);
    this.currentPage.set(1);
  }
  get data(): T[] {
    return this._data();
  }

  @Input({ required: true })
  set columns(value: TableColumn[] | undefined | null) {
    this._columns.set(value ?? []);
  }
  get columns(): TableColumn[] {
    return this._columns();
  }

  @Input()
  set loading(value: boolean | undefined | null) {
    this._loading.set(!!value);
  }
  get loading(): boolean {
    return this._loading();
  }

  @Input()
  set searchEnabled(value: boolean | undefined | null) {
    this._searchEnabled.set(value ?? true);
  }
  get searchEnabled(): boolean {
    return this._searchEnabled();
  }

  @Input()
  set pagination(value: boolean | undefined | null) {
    this._pagination.set(value ?? true);
  }
  get pagination(): boolean {
    return this._pagination();
  }

  @Input()
  set showBanUnban(value: boolean | undefined | null) {
    this._showBanUnban.set(!!value);
  }
  get showBanUnban(): boolean {
    return this._showBanUnban();
  }

  @Output() readonly edit = new EventEmitter<T>();
  @Output() readonly delete = new EventEmitter<T>();
  @Output() readonly view = new EventEmitter<T>();
  @Output() readonly ban = new EventEmitter<T>();
  @Output() readonly unban = new EventEmitter<T>();

  readonly searchTerm = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(10);

  readonly filteredData = computed<T[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this._data();
    }

    return this._data().filter((item) =>
      Object.values(item).some((value) =>
        value != null && value.toString().toLowerCase().includes(term)
      )
    );
  });

  readonly totalItems = computed<number>(() => this.filteredData().length);

  readonly totalPages = computed<number>(
    () => Math.ceil(this.totalItems() / this.itemsPerPage()) || 1
  );

  readonly paginatedData = computed<T[]>(() => {
    if (!this._pagination()) {
      return this.filteredData();
    }
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(
      startIndex,
      startIndex + this.itemsPerPage()
    );
  });

  readonly pageNumbers = computed<number[]>(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly skeletonRows = computed<number[]>(() => {
    const count = Math.min(this.itemsPerPage(), 5);
    return Array.from({ length: count }, (_, index) => index);
  });

  readonly isCompactMode = computed<boolean>(() => this._columns().length > 4);

  readonly tableCaption = computed<string>(() => {
    const base = 'Tabla de resultados del sistema';
    const columnLabels = this._columns()
      .map((column) => column.label)
      .filter(Boolean);
    if (!columnLabels.length) {
      return base;
    }

    return `${base} con columnas ${columnLabels.join(', ')}`;
  });

  readonly statusMessage = computed<string>(() => {
    if (this._loading()) {
      return 'Cargando datos, por favor espera.';
    }

    const count = this.totalItems();
    if (!count) {
      return this.searchTerm().trim()
        ? 'No se encontraron resultados para la búsqueda actual.'
        : 'No hay datos para mostrar.';
    }

    return `${count} resultado${count === 1 ? '' : 's'} disponibles.`;
  });

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input?.value ?? '');
    this.currentPage.set(1);
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
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
