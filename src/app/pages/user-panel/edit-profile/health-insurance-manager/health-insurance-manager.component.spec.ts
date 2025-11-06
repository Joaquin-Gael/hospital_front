import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthInsuranceManagerComponent } from './health-insurance-manager.component';
import { API_TOKEN_MOCKS } from '../../../../testing/api-token.mocks';

describe('HealthInsuranceManagerComponent', () => {
  let component: HealthInsuranceManagerComponent;
  let fixture: ComponentFixture<HealthInsuranceManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthInsuranceManagerComponent],
      providers: [...API_TOKEN_MOCKS]
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
