import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAppointmentDoctorAvailabilityComponent } from './patient-appointment-doctor-availability.component';

describe('PatientAppointmentDoctorAvailabilityComponent', () => {
  let component: PatientAppointmentDoctorAvailabilityComponent;
  let fixture: ComponentFixture<PatientAppointmentDoctorAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointmentDoctorAvailabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentDoctorAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
