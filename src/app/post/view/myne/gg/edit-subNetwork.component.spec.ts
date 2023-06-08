import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SubNetworkService } from '../subNetwork.service';
import { EditSubNetworkComponent } from './edit-subNetwork.component';

describe('EditSubNetworkComponent', () => {
  let component: EditSubNetworkComponent;
  let fixture: ComponentFixture<EditSubNetworkComponent>;

  beforeEach(() => {
    const matDialogStub = () => ({
      open: (recordCancelComponent, object) => ({
        afterClosed: () => ({ subscribe: f => f({}) })
      }),
      closeAll: () => ({})
    });
    const matDialogRefStub = () => ({});
    const routerStub = () => ({});
    const subNetworkServiceStub = () => ({
      updateSubnetwok: data => ({ subscribe: f => f({}) })
    });
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [EditSubNetworkComponent],
      providers: [
        { provide: MatDialog, useFactory: matDialogStub },
        { provide: MatDialogRef, useFactory: matDialogRefStub },
        { provide: Router, useFactory: routerStub },
        { provide: SubNetworkService, useFactory: subNetworkServiceStub }
      ]
    });
    fixture = TestBed.createComponent(EditSubNetworkComponent);
    component = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  it(`isLoading has default value`, () => {
    expect(component.isLoading).toEqual(false);
  });

  describe('cancelAlert', () => {
    it('makes expected calls', () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(matDialogStub, 'open').and.callThrough();
      spyOn(matDialogStub, 'closeAll').and.callThrough();
      component.cancelAlert();
      expect(matDialogStub.open).toHaveBeenCalled();
      expect(matDialogStub.closeAll).toHaveBeenCalled();
    });
  });
});
