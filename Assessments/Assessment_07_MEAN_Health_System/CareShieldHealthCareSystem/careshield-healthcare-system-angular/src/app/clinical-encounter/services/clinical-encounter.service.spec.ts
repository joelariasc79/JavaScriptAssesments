import { TestBed } from '@angular/core/testing';

import { ClinicalEncounterService } from './clinical-encounter.service';

describe('ClinicalEncounterService', () => {
  let service: ClinicalEncounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClinicalEncounterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
