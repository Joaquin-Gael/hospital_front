import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean; // columna ordenable
  format?: (value: any) => string;
}

export interface HasIsActive {
  is_active?: boolean;
}

export interface DataTableActionsConfig {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  ban?: boolean;
  unban?: boolean;
  download?: boolean;
}

const DEFAULT_ACTIONS: Required<DataTableActionsConfig> = {
  view: true,
  edit: true,
  delete: true,
  ban: true,
  unban: true,
  download: true,
};

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
  private readonly _enableDownloadReceipt = signal<boolean>(false);
  private readonly _downloadLoading = signal<boolean>(false);
  private readonly _actions = signal<Required<DataTableActionsConfig>>(DEFAULT_ACTIONS);
  
  // Estado de error
  private readonly _error = signal<string | null>(null);
  
  // Timer para debounce
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  @Input({ required: true })
  set data(value: T[] | undefined | null) {
    this._data.set(value ?? []);
    this.currentPage.set(1);
    // Limpiar error cuando llegan datos nuevos
    if (value && value.length > 0) {
      this._error.set(null);
    }
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

  @Input()
  set enableDownloadReceipt(value: boolean | undefined | null) {
    this._enableDownloadReceipt.set(!!value);
  }
  get enableDownloadReceipt(): boolean {
    return this._enableDownloadReceipt();
  }

  @Input()
  set downloadLoading(value: boolean | undefined | null) {
    this._downloadLoading.set(!!value);
  }
  get downloadLoading(): boolean {
    return this._downloadLoading();
  }

  @Input()
  set actions(value: DataTableActionsConfig | undefined | null) {
    this._actions.set({ ...DEFAULT_ACTIONS, ...(value ?? {}) });
  }
  get actions(): Required<DataTableActionsConfig> {
    return this._actions();
  }

  // Input para error externo (opcional)
  @Input()
  set error(value: string | null | undefined) {
    this._error.set(value ?? null);
  }
  get error(): string | null {
    return this._error();
  }

  @Output() readonly edit = new EventEmitter<T>();
  @Output() readonly delete = new EventEmitter<T>();
  @Output() readonly view = new EventEmitter<T>();
  @Output() readonly ban = new EventEmitter<T>();
  @Output() readonly unban = new EventEmitter<T>();
  @Output() readonly download = new EventEmitter<T>();
  @Output() readonly retry = new EventEmitter<void>(); // evento retry

  readonly searchTerm = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(10);
  
  // Sorting state
  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  
  // Opciones de items por página
  readonly itemsPerPageOptions = [10, 25, 50, 100];

  // NUEVO: Datos filtrados Y ordenados
  readonly filteredAndSortedData = computed<T[]>(() => {
    let result = this.filteredData();
    
    const column = this.sortColumn();
    if (!column) {
      return result;
    }
    
    const direction = this.sortDirection();
    
    return [...result].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      // Manejar null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;
      
      // Comparación
      let comparison = 0;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'es', { sensitivity: 'base' });
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  });

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

  readonly totalItems = computed<number>(() => this.filteredAndSortedData().length);

  readonly totalPages = computed<number>(
    () => Math.ceil(this.totalItems() / this.itemsPerPage()) || 1
  );

  readonly paginatedData = computed<T[]>(() => {
    if (!this._pagination()) {
      return this.filteredAndSortedData();
    }
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredAndSortedData().slice(
      startIndex,
      startIndex + this.itemsPerPage()
    );
  });

  readonly pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    
    // Si hay pocas páginas, mostrar todas
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    // Lógica para mostrar páginas alrededor de la actual
    const pages: number[] = [];
    
    // Siempre mostrar primera página
    pages.push(1);
    
    // Calcular rango alrededor de la página actual
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);
    
    // Ajustar si estamos cerca del inicio
    if (current <= 3) {
      end = Math.min(5, total - 1);
    }
    
    // Ajustar si estamos cerca del final
    if (current >= total - 2) {
      start = Math.max(2, total - 4);
    }
    
    // Agregar "..." si hay gap
    if (start > 2) {
      pages.push(-1); // -1 representa "..."
    }
    
    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Agregar "..." si hay gap
    if (end < total - 1) {
      pages.push(-1);
    }
    
    // Siempre mostrar última página
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  });

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

    if (this._error()) {
      return 'Error al cargar los datos.';
    }

    const count = this.totalItems();
    if (!count) {
      return this.searchTerm().trim()
        ? 'No se encontraron resultados para la búsqueda actual.'
        : 'No hay datos para mostrar.';
    }

    const showing = this.paginatedData().length;
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = start + showing - 1;

    if (this._pagination() && this.totalPages() > 1) {
      return `Mostrando ${start} a ${end} de ${count} resultado${count === 1 ? '' : 's'}.`;
    }

    return `${count} resultado${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}.`;
  });

  // Búsqueda con debounce
  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input?.value ?? '';
    
    // Cancelar timer anterior
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    // Crear nuevo timer (300ms de delay)
    this.searchDebounceTimer = setTimeout(() => {
      this.searchTerm.set(value);
      this.currentPage.set(1);
    }, 300);
  }

  // Cambiar items por página
  changeItemsPerPage(items: number): void {
    this.itemsPerPage.set(items);
    this.currentPage.set(1);
  }

  // Toggle sorting
  toggleSort(columnKey: string): void {
    const column = this._columns().find(c => c.key === columnKey);
    
    // Solo ordenar si la columna es sortable
    if (!column || column.sortable === false) {
      return;
    }
    
    if (this.sortColumn() === columnKey) {
      // Cambiar dirección: asc -> desc -> null
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortColumn.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      // Nueva columna
      this.sortColumn.set(columnKey);
      this.sortDirection.set('asc');
    }
  }

  // Obtener estado de sorting para una columna
  getSortState(columnKey: string): 'asc' | 'desc' | null {
    if (this.sortColumn() !== columnKey) {
      return null;
    }
    return this.sortDirection();
  }

  // Verificar si columna es sortable
  isColumnSortable(column: TableColumn): boolean {
    // Por defecto todas son sortables, excepto que se indique lo contrario
    return column.sortable !== false;
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

  onDownload(item: T): void {
    if (!this._downloadLoading()) {
      this.download.emit(item);
    }
  }

  onRetry(): void {
    this._error.set(null);
    this.retry.emit();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }
}