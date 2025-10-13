import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeedbackFormComponent } from './doctor-feedback-form.component';

describe('DoctorFeedbackFormComponent', () => {
  let component: DoctorFeedbackFormComponent;
  let fixture: ComponentFixture<DoctorFeedbackFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeedbackFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeedbackFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
