import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallPoints } from './overall-points';

describe('OverallPoints', () => {
  let component: OverallPoints;
  let fixture: ComponentFixture<OverallPoints>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverallPoints]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverallPoints);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
