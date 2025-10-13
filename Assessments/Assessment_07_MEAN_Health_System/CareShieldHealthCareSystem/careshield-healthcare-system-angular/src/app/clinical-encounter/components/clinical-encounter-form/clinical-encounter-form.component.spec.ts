import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalEncounterFormComponent } from './clinical-encounter-form.component';

describe('ClinicalEncounterFormComponent', () => {
  let component: ClinicalEncounterFormComponent;
  let fixture: ComponentFixture<ClinicalEncounterFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalEncounterFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicalEncounterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
