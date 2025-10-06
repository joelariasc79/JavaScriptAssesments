import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiseaseFormComponent } from './disease-form.component';

describe('DiseaseFormComponent', () => {
  let component: DiseaseFormComponent;
  let fixture: ComponentFixture<DiseaseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiseaseFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiseaseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
