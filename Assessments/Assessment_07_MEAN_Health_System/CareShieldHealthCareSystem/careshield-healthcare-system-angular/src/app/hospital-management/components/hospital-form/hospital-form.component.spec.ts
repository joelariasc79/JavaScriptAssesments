import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalFormComponent } from './hospital-form.component';

describe('HospitalFormComponent', () => {
  let component: HospitalFormComponent;
  let fixture: ComponentFixture<HospitalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
