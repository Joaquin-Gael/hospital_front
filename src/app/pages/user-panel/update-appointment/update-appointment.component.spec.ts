import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAppointmentComponent } from './update-appointment.component';

describe('UpdateAppointmentComponent', () => {
  let component: UpdateAppointmentComponent;
  let fixture: ComponentFixture<UpdateAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateAppointmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
