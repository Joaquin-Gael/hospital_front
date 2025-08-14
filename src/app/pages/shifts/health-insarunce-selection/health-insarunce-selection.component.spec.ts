import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthInsarunceSelectionComponent } from './health-insarunce-selection.component';

describe('HealthInsarunceSelectionComponent', () => {
  let component: HealthInsarunceSelectionComponent;
  let fixture: ComponentFixture<HealthInsarunceSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthInsarunceSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthInsarunceSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
