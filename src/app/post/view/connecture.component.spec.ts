import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ConnectureService } from '../connecture.service';
import { MessageService } from 'primeng/api';
import { ConnectureComponent } from './connecture.component';

describe('ConnectureComponent', () => {
  let component: ConnectureComponent;
  let fixture: ComponentFixture<ConnectureComponent>;

  beforeEach(() => {
    const formBuilderStub = () => ({});
    const connectureServiceStub = () => ({
      getRxCode: year => ({ subscribe: f => f({}) }),
      generateGPIReport: (year, rxCodes) => ({ subscribe: f => f({}) }),
      generateDCBCReport: (year, rxCodes) => ({ subscribe: f => f({}) })
    });
    const messageServiceStub = () => ({
      clear: () => ({}),
      add: object => ({})
    });
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ConnectureComponent],
      providers: [
        { provide: FormBuilder, useFactory: formBuilderStub },
        { provide: ConnectureService, useFactory: connectureServiceStub },
        { provide: MessageService, useFactory: messageServiceStub }
      ]
    });
    fixture = TestBed.createComponent(ConnectureComponent);
    component = fixture.componentInstance;
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
  });

  it(`yearItems has default value`, () => {
    expect(component.yearItems).toEqual([]);
  });

  it(`rxCodesItems has default value`, () => {
    expect(component.rxCodesItems).toEqual([]);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  it(`isLoading has default value`, () => {
    expect(component.isLoading).toEqual(false);
  });

  it(`planYear has default value`, () => {
    expect(component.planYear).toEqual(defaultYear);
  });

  it(`_rxCodes has default value`, () => {
    expect(component._rxCodes).toEqual([]);
  });

  describe('ngOnInit', () => {
    it('makes expected calls', () => {
      spyOn(component, 'getRxCodeData').and.callThrough();
      component.ngOnInit();
      expect(component.getRxCodeData).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('makes expected calls', () => {
      spyOn(component, 'generateGPIReport').and.callThrough();
      component.submit();
      expect(component.generateGPIReport).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('makes expected calls', () => {
      spyOn(component, 'getRxCodeData').and.callThrough();
      spyOn(component, 'resetValidation').and.callThrough();
      component.clear();
      expect(component.getRxCodeData).toHaveBeenCalled();
      expect(component.resetValidation).toHaveBeenCalled();
    });
  });
});
