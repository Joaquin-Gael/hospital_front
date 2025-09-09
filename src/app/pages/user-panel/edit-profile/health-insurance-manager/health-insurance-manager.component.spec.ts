import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthInsuranceManagerComponent } from './health-insurance-manager.component';

describe('HealthInsuranceManagerComponent', () => {
  let component: HealthInsuranceManagerComponent;
  let fixture: ComponentFixture<HealthInsuranceManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthInsuranceManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthInsuranceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
