import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { SubNetworkService } from "../subNetwork.service";
import { SharedService } from "src/app/services/sharedServices/play-book-service/shared.service";
import { LocalStorageService } from "src/app/utility/local-storage-management/local-storage.service";
import { Router } from "@angular/router";
import { searchSubNetworkComponent } from "./subNetwork.component";

describe("searchSubNetworkComponent", () => {
  let component: searchSubNetworkComponent;
  let fixture: ComponentFixture<searchSubNetworkComponent>;

  beforeEach(() => {
    const matDialogStub = () => ({
      open: (recordSaveComponent, object) => ({
        afterClosed: () => ({ subscribe: f => f({}) })
      }),
      closeAll: () => ({})
    });
    const subNetworkServiceStub = () => ({
      listAllPlanYear: () => ({ subscribe: f => f({}) }),
      listAllPlanOption: year => ({ subscribe: f => f({}) }),
      listAllPlanID: year => ({ subscribe: f => f({}) }),
      listAllSubNetworkName: () => ({ subscribe: f => f({}) }),
      getSubnetworks: (planYear, policyType, plans) => ({
        subscribe: f => f({})
      }),
      getDataForExcelReport: () => ({ subscribe: f => f({}) }),
      addSubnetwok: data => ({ subscribe: f => f({}) })
    });
    const sharedServiceStub = () => ({});
    const localStorageServiceStub = () => ({});
    const routerStub = () => ({});
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [searchSubNetworkComponent],
      providers: [
        { provide: MatDialog, useFactory: matDialogStub },
        { provide: SubNetworkService, useFactory: subNetworkServiceStub },
        { provide: SharedService, useFactory: sharedServiceStub },
        { provide: LocalStorageService, useFactory: localStorageServiceStub },
        { provide: Router, useFactory: routerStub }
      ]
    });
    fixture = TestBed.createComponent(searchSubNetworkComponent);
    component = fixture.componentInstance;
  });

  it("can load instance", () => {
    expect(component).toBeTruthy();
  });

  it(`isLoading has default value`, () => {
    expect(component.isLoading).toEqual(false);
  });

  it(`isLoadingTable has default value`, () => {
    expect(component.isLoadingTable).toEqual(false);
  });

  it(`hideTable has default value`, () => {
    expect(component.hideTable).toEqual(false);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  it(`validate has default value`, () => {
    expect(component.validate).toEqual(false);
  });

  it(`descSort has default value`, () => {
    expect(component.descSort).toEqual(ClrDatagridSortOrder.DESC);
  });

  it(`check1 has default value`, () => {
    expect(component.check1).toEqual(false);
  });

  it(`closedTabs has default value`, () => {
    expect(component.closedTabs).toEqual([]);
  });

  it(`tabs has default value`, () => {
    expect(component.tabs).toEqual([]);
  });

  it(`dataSource has default value`, () => {
    expect(component.dataSource).toEqual([]);
  });

  it(`spinner has default value`, () => {
    expect(component.spinner).toEqual(false);
  });

  it(`year_data has default value`, () => {
    expect(component.year_data).toEqual([]);
  });

  it(`plans_Data has default value`, () => {
    expect(component.plans_Data).toEqual([]);
  });

  it(`users has default value`, () => {
    expect(component.users).toEqual([]);
  });

  it(`TabIndex has default value`, () => {
    expect(component.TabIndex).toEqual(1);
  });

  it(`tabledatainexcel has default value`, () => {
    expect(component.tabledatainexcel).toEqual([]);
  });

  it(`tabs1 has default value`, () => {
    expect(component.tabs1).toEqual([`Search`, `Add New SubNetwork`]);
  });

  it(`tabs2 has default value`, () => {
    expect(component.tabs2).toEqual([`Search`]);
  });

  it(`editButtonS has default value`, () => {
    expect(component.editButtonS).toEqual(false);
  });

  it(`temp has default value`, () => {
    expect(component.temp).toEqual([]);
  });

  describe("onTabChange", () => {
    it("makes expected calls", () => {
      const matTabChangeEventStub: MatTabChangeEvent = <any>{};
      spyOn(component, "getAllSubNetworkNames").and.callThrough();
      component.onTabChange(matTabChangeEventStub);
      expect(component.getAllSubNetworkNames).toHaveBeenCalled();
    });
  });

  describe("ngOnInit", () => {
    it("makes expected calls", () => {
      spyOn(component, "getPlansData").and.callThrough();
      component.ngOnInit();
      expect(component.getPlansData).toHaveBeenCalled();
    });
  });

  describe("cancelpopup", () => {
    it("makes expected calls", () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(component, "resetForm").and.callThrough();
      spyOn(component, "removeTab2").and.callThrough();
      spyOn(matDialogStub, "open").and.callThrough();
      component.cancelpopup();
      expect(component.resetForm).toHaveBeenCalled();
      expect(component.removeTab2).toHaveBeenCalled();
      expect(matDialogStub.open).toHaveBeenCalled();
    });
  });

  describe("getAllSubNetworkNames", () => {
    it("makes expected calls", () => {
      const subNetworkServiceStub: SubNetworkService = fixture.debugElement.injector.get(
        SubNetworkService
      );
      spyOn(subNetworkServiceStub, "listAllSubNetworkName").and.callThrough();
      component.getAllSubNetworkNames();
      expect(subNetworkServiceStub.listAllSubNetworkName).toHaveBeenCalled();
    });
  });

  describe("exportAsXLSX", () => {
    it("makes expected calls", () => {
      const subNetworkServiceStub: SubNetworkService = fixture.debugElement.injector.get(
        SubNetworkService
      );
      spyOn(subNetworkServiceStub, "getDataForExcelReport").and.callThrough();
      component.exportAsXLSX();
      expect(subNetworkServiceStub.getDataForExcelReport).toHaveBeenCalled();
    });
  });

  describe("openDialogEdit", () => {
    it("makes expected calls", () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(matDialogStub, "open").and.callThrough();
      component.openDialogEdit();
      expect(matDialogStub.open).toHaveBeenCalled();
    });
  });

  describe("addTab", () => {
    it("makes expected calls", () => {
      spyOn(component, "removeTab").and.callThrough();
      component.addTab();
      expect(component.removeTab).toHaveBeenCalled();
    });
  });
});
