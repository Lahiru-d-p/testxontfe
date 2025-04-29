import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionPromptComponent } from './selection-prompt.component';

describe('SelectionPromptComponent', () => {
  let component: SelectionPromptComponent;
  let fixture: ComponentFixture<SelectionPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionPromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
