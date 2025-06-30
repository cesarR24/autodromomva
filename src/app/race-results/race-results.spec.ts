import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceResults } from './race-results';

describe('RaceResults', () => {
  let component: RaceResults;
  let fixture: ComponentFixture<RaceResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaceResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceResults);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
