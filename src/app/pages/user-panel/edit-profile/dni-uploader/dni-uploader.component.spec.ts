import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DniUploaderComponent } from './dni-uploader.component';

describe('DniUploaderComponent', () => {
  let component: DniUploaderComponent;
  let fixture: ComponentFixture<DniUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DniUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DniUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
