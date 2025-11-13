import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescheduleTurnDialogComponent } from './reschedule-turn-dialog.component';

describe('RescheduleTurnDialogComponent', () => {
  let component: RescheduleTurnDialogComponent;
  let fixture: ComponentFixture<RescheduleTurnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescheduleTurnDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescheduleTurnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
