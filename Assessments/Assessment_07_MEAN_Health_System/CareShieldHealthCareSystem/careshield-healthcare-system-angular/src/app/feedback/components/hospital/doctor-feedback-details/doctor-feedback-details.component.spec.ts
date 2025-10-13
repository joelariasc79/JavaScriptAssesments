import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeedbackDetailsComponent } from './doctor-feedback-details.component';

describe('DoctorFeedbackDetailsComponent', () => {
  let component: DoctorFeedbackDetailsComponent;
  let fixture: ComponentFixture<DoctorFeedbackDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeedbackDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeedbackDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
