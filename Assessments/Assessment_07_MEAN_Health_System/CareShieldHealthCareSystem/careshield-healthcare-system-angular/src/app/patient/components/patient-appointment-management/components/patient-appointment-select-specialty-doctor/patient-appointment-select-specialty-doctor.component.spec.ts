import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAppointmentSelectSpecialtyDoctorComponent } from './patient-appointment-select-specialty-doctor.component';

describe('PatientAppointmentSelectSpecialtyDoctorComponent', () => {
  let component: PatientAppointmentSelectSpecialtyDoctorComponent;
  let fixture: ComponentFixture<PatientAppointmentSelectSpecialtyDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointmentSelectSpecialtyDoctorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentSelectSpecialtyDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
