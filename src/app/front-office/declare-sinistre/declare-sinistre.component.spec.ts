import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclareSinistreComponent } from './declare-sinistre.component';

describe('DeclareSinistreComponent', () => {
  let component: DeclareSinistreComponent;
  let fixture: ComponentFixture<DeclareSinistreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclareSinistreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeclareSinistreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
