import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoelComponent } from './joel.component';

describe('JoelComponent', () => {
  let component: JoelComponent;
  let fixture: ComponentFixture<JoelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
