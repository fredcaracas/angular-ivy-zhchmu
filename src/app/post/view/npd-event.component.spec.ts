import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { EventsService } from '../../services/NPDEvent.service';
import { NPDEventComponent } from './npd-event.component';

describe('NPDEventComponent', () => {
  let component: NPDEventComponent;
  let fixture: ComponentFixture<NPDEventComponent>;

  beforeEach(() => {
    const domSanitizerStub = () => ({});
    const matDialogStub = () => ({
      open: (detailsDialogComponent, object) => ({})
    });
    const eventsServiceStub = () => ({
      getEvents: (product, days) => ({ subscribe: f => f({}) }),
      getEventsDetails: (product, transactionID) => ({ subscribe: f => f({}) })
    });
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [NPDEventComponent],
      providers: [
        { provide: DomSanitizer, useFactory: domSanitizerStub },
        { provide: MatDialog, useFactory: matDialogStub },
        { provide: EventsService, useFactory: eventsServiceStub }
      ]
    });
    fixture = TestBed.createComponent(NPDEventComponent);
    component = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
  });

  it(`messages has default value`, () => {
    expect(component.messages).toEqual([]);
  });

  it(`displayedColumns has default value`, () => {
    expect(component.displayedColumns).toEqual([
      `TransactionID`,
      `EventIdentifier`,
      `EventEntity`,
      `EventName`,
      `EventTime`,
      `Action`
    ]);
  });

  it(`isLoading has default value`, () => {
    expect(component.isLoading).toEqual(false);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      spyOn(component, 'getEvents').and.callThrough();
      component.ngOnInit();
      expect(component.getEvents).toHaveBeenCalled();
    });
  });

  describe('openDialog', () => {
    it('makes expected calls', () => {
      const matDialogStub: MatDialog = fixture.debugElement.injector.get(
        MatDialog
      );
      spyOn(matDialogStub, 'open').and.callThrough();
      component.openDialog();
      expect(matDialogStub.open).toHaveBeenCalled();
    });
  });

  describe('exportExcel', () => {
    it('makes expected calls', () => {
      spyOn(component, 'saveAsExcelFile').and.callThrough();
      component.exportExcel();
      expect(component.saveAsExcelFile).toHaveBeenCalled();
    });
  });
});
