import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeedbackListComponent } from './doctor-feedback-list.component';

describe('DoctorFeedbackListComponent', () => {
  let component: DoctorFeedbackListComponent;
  let fixture: ComponentFixture<DoctorFeedbackListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeedbackListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeedbackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
