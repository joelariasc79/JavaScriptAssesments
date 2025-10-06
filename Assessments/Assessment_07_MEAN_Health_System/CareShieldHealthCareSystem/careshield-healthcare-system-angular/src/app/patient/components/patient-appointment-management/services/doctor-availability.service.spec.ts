import { TestBed } from '@angular/core/testing';

import { DoctorAvailabilityService } from './doctor-availability.service';

describe('DoctorAvailabilityService', () => {
  let service: DoctorAvailabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DoctorAvailabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
