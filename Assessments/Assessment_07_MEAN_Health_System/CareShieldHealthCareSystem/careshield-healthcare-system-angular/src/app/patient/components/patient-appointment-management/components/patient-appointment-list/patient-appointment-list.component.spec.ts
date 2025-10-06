import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAppointmentListComponent } from './patient-appointment-list.component';

describe('PatientAppointmentListComponent', () => {
  let component: PatientAppointmentListComponent;
  let fixture: ComponentFixture<PatientAppointmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointmentListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
