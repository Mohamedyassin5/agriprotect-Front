import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentsTableComponent } from './incidents-table.component';

describe('IncidentsTableComponent', () => {
  let component: IncidentsTableComponent;
  let fixture: ComponentFixture<IncidentsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
