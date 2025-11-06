import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent, TableColumn } from './data-table.component';
import { API_TOKEN_MOCKS } from '../../testing/api-token.mocks';

describe('DataTableComponent', () => {
  type TableRow = { name: string; email: string; is_active: boolean };

  let component: DataTableComponent<TableRow>;
  let fixture: ComponentFixture<DataTableComponent<any>>;

  const columns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
  ];

  const data: TableRow[] = [
    { name: 'Juan Pérez', email: 'juan@example.com', is_active: true },
    { name: 'María López', email: 'maria@example.com', is_active: false },
    { name: 'Andrés Díaz', email: 'andres@example.com', is_active: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
      providers: [...API_TOKEN_MOCKS],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance as DataTableComponent<TableRow>;
    component.columns = columns;
    component.data = data;
    fixture.detectChanges();
  });

  it('should emit outputs for row actions', () => {
    const row = component.data[0];
    const editSpy = jasmine.createSpy('edit');
    const deleteSpy = jasmine.createSpy('delete');
    const viewSpy = jasmine.createSpy('view');
    const banSpy = jasmine.createSpy('ban');
    const unbanSpy = jasmine.createSpy('unban');

    component.edit.subscribe(editSpy);
    component.delete.subscribe(deleteSpy);
    component.view.subscribe(viewSpy);
    component.ban.subscribe(banSpy);
    component.unban.subscribe(unbanSpy);

    component.onEdit(row);
    component.onDelete(row);
    component.onView(row);
    component.onBan(row);
    component.onUnban(row);

    expect(editSpy).toHaveBeenCalledOnceWith(row);
    expect(deleteSpy).toHaveBeenCalledOnceWith(row);
    expect(viewSpy).toHaveBeenCalledOnceWith(row);
    expect(banSpy).toHaveBeenCalledOnceWith(row);
    expect(unbanSpy).toHaveBeenCalledOnceWith(row);
  });

  it('should filter rows when search term changes', () => {
    component.searchTerm.set('maria');

    expect(component.filteredData().length).toBe(1);
    expect(component.filteredData()[0]).toEqual(data[1]);
  });

  it('should provide status messages for loading and empty states', () => {
    component.loading = true;
    expect(component.statusMessage()).toContain('Cargando');

    component.loading = false;
    component.data = [];
    fixture.detectChanges();
    expect(component.statusMessage()).toContain('No hay datos');

    component.searchTerm.set('sin resultados');
    expect(component.statusMessage()).toContain('No se encontraron resultados');
  });

  it('should update current page when changePage is invoked', () => {
    component.pagination = true;
    component.changePage(2);

    expect(component.currentPage()).toBe(2);
  });
});
