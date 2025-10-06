import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientScreeningFormComponent } from './patient-screening-form.component';

describe('PatientScreeningFormComponent', () => {
  let component: PatientScreeningFormComponent;
  let fixture: ComponentFixture<PatientScreeningFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientScreeningFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientScreeningFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
