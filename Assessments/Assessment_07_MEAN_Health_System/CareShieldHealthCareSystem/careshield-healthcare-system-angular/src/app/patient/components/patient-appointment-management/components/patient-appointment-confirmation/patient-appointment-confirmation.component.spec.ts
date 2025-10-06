import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAppointmentConfirmationComponent } from './patient-appointment-confirmation.component';

describe('PatientAppointmentConfirmationComponent', () => {
  let component: PatientAppointmentConfirmationComponent;
  let fixture: ComponentFixture<PatientAppointmentConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointmentConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
