import { TestBed } from '@angular/core/testing';

import { PatientScreeningService } from './patient-screening.service';

describe('PatientScreeningService', () => {
  let service: PatientScreeningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientScreeningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
