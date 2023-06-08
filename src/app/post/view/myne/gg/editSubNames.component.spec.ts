import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { SubNetworkService } from '../../subNetwork.service';
import { Router } from '@angular/router';
import { EditSubNetworkNameComponent } from './editSubNames.component';

describe('EditSubNetworkNameComponent', () => {
  let component: EditSubNetworkNameComponent;
  let fixture: ComponentFixture<EditSubNetworkNameComponent>;

  beforeEach(() => {
    const matDialogStub = () => ({
      open: (recordCancelComponent, object) => ({
        afterClosed: () => ({ subscribe: f => f({}) })
      }),
      closeAll: () => ({})
    });
    const matDialogRefStub = () => ({});
    const subNetworkServiceStub = () => ({
      listAllSubNetworkName: () => ({ subscribe: f => f({}) }),
      updateSubNetwokName: (data, name) => ({ subscribe: f => f({}) })
    });
    const routerStub = () => ({});
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [EditSubNetworkNameComponent],
      providers: [
        { provide: MatDialog, useFactory: matDialogStub },
        { provide: MatDialogRef, useFactory: matDialogRefStub },
        { provide: SubNetworkService, useFactory: subNetworkServiceStub },
        { provide: Router, useFactory: routerStub }
      ]
    });
    fixture = TestBed.createComponent(EditSubNetworkNameComponent);
    component = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
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

  describe('saveEditedSubName', () => {
    it('makes expected calls', () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      const subNetworkServiceStub: SubNetworkService = fixture.debugElement.injector.get(
        SubNetworkService
      );
      spyOn(component, 'alertpopup').and.callThrough();
      spyOn(matDialogStub, 'open').and.callThrough();
      spyOn(matDialogStub, 'closeAll').and.callThrough();
      spyOn(subNetworkServiceStub, 'listAllSubNetworkName').and.callThrough();
      spyOn(subNetworkServiceStub, 'updateSubNetwokName').and.callThrough();
      component.saveEditedSubName();
      expect(component.alertpopup).toHaveBeenCalled();
      expect(matDialogStub.open).toHaveBeenCalled();
      expect(matDialogStub.closeAll).toHaveBeenCalled();
      expect(subNetworkServiceStub.listAllSubNetworkName).toHaveBeenCalled();
      expect(subNetworkServiceStub.updateSubNetwokName).toHaveBeenCalled();
    });
  });
});
