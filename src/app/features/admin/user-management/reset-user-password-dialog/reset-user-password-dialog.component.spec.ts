import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetUserPasswordDialogComponent } from './reset-user-password-dialog.component';

describe('ResetUserPasswordDialogComponent', () => {
  let component: ResetUserPasswordDialogComponent;
  let fixture: ComponentFixture<ResetUserPasswordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetUserPasswordDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetUserPasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
