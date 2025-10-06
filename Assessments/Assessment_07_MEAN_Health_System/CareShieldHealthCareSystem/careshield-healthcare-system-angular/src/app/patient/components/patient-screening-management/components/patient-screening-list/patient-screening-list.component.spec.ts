import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientScreeningListComponent } from './patient-screening-list.component';

describe('PatientScreeningListComponent', () => {
  let component: PatientScreeningListComponent;
  let fixture: ComponentFixture<PatientScreeningListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientScreeningListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientScreeningListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
