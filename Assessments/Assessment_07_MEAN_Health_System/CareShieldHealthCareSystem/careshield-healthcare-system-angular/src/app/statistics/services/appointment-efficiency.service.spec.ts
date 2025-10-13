import { TestBed } from '@angular/core/testing';

import { AppointmentEfficiencyService } from './appointment-efficiency.service';

describe('AppointmentEfficiencyService', () => {
  let service: AppointmentEfficiencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentEfficiencyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
