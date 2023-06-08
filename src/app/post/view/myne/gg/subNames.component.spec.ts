import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubNetworkService } from '../subNetwork.service';
import { SharedService } from 'src/app/services/sharedServices/play-book-service/shared.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SubNamesComponent } from './subNames.component';

describe('SubNamesComponent', () => {
  let component: SubNamesComponent;
  let fixture: ComponentFixture<SubNamesComponent>;

  beforeEach(() => {
    const subNetworkServiceStub = () => ({
      listAllSubNetworkName: () => ({ subscribe: f => f({}) })
    });
    const sharedServiceStub = () => ({});
    const matDialogStub = () => ({
      open: (editSubNetworkNameComponent, object) => ({
        afterClosed: () => ({ subscribe: f => f({}) })
      })
    });
    const routerStub = () => ({});
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [SubNamesComponent],
      providers: [
        { provide: SubNetworkService, useFactory: subNetworkServiceStub },
        { provide: SharedService, useFactory: sharedServiceStub },
        { provide: MatDialog, useFactory: matDialogStub },
        { provide: Router, useFactory: routerStub }
      ]
    });
    fixture = TestBed.createComponent(SubNamesComponent);
    component = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
  });

  it(`users has default value`, () => {
    expect(component.users).toEqual([]);
  });

  it(`dataSource has default value`, () => {
    expect(component.dataSource).toEqual([]);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(true);
  });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      spyOn(component, 'getSubNames').and.callThrough();
      component.ngOnInit();
      expect(component.getSubNames).toHaveBeenCalled();
    });
  });

  describe('getSubNames', () => {
    it('makes expected calls', () => {
      const subNetworkServiceStub: SubNetworkService = fixture.debugElement.injector.get(
        SubNetworkService
      );
      spyOn(subNetworkServiceStub, 'listAllSubNetworkName').and.callThrough();
      component.getSubNames();
      expect(subNetworkServiceStub.listAllSubNetworkName).toHaveBeenCalled();
    });
  });

  describe('openDialogAddBBI', () => {
    it('makes expected calls', () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(component, 'getSubNames').and.callThrough();
      spyOn(matDialogStub, 'open').and.callThrough();
      component.openDialogAddBBI();
      expect(component.getSubNames).toHaveBeenCalled();
      expect(matDialogStub.open).toHaveBeenCalled();
    });
  });

  describe('openDialogAddSubName', () => {
    it('makes expected calls', () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(component, 'getSubNames').and.callThrough();
      spyOn(matDialogStub, 'open').and.callThrough();
      component.openDialogAddSubName();
      expect(component.getSubNames).toHaveBeenCalled();
      expect(matDialogStub.open).toHaveBeenCalled();
    });
  });
});
