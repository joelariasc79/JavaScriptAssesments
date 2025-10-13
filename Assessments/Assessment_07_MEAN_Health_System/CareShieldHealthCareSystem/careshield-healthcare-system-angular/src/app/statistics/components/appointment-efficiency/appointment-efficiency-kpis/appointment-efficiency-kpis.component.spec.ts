import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentEfficiencyKpisComponent } from './appointment-efficiency-kpis.component';

describe('AppointmentEfficiencyKpisComponent', () => {
  let component: AppointmentEfficiencyKpisComponent;
  let fixture: ComponentFixture<AppointmentEfficiencyKpisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentEfficiencyKpisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentEfficiencyKpisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
