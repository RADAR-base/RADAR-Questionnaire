import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyInfoComponent } from './study-info.component';

describe('StudyInfoComponent', () => {
  let component: StudyInfoComponent;
  let fixture: ComponentFixture<StudyInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudyInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
