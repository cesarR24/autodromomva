import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRaceEntry } from './admin-race-entry';

describe('AdminRaceEntry', () => {
  let component: AdminRaceEntry;
  let fixture: ComponentFixture<AdminRaceEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRaceEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRaceEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
