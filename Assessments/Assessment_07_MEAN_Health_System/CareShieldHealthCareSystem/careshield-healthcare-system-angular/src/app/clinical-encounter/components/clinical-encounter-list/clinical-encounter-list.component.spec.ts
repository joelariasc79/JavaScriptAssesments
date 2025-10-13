import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalEncounterListComponent } from './clinical-encounter-list.component';

describe('ClinicalEncounterListComponent', () => {
  let component: ClinicalEncounterListComponent;
  let fixture: ComponentFixture<ClinicalEncounterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalEncounterListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicalEncounterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
