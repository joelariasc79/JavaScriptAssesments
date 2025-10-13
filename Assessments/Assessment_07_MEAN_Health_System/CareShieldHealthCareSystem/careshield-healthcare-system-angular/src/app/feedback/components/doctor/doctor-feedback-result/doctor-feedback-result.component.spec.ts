import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeedbackResultComponent } from './doctor-feedback-result.component';

describe('DoctorFeedbackResultComponent', () => {
  let component: DoctorFeedbackResultComponent;
  let fixture: ComponentFixture<DoctorFeedbackResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeedbackResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeedbackResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
