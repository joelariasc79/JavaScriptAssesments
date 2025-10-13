import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorsFeedbackListResultComponent } from './doctors-feedback-list-result.component';

describe('DoctorsFeedbackListResultComponent', () => {
  let component: DoctorsFeedbackListResultComponent;
  let fixture: ComponentFixture<DoctorsFeedbackListResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorsFeedbackListResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorsFeedbackListResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
