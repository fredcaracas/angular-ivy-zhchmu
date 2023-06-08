import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { SubNetworkService } from './subNetwork.service';

describe('SubNetworkService', () => {
  let service: SubNetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubNetworkService]
    });
    service = TestBed.get(SubNetworkService);
  });

  it('can load instance', () => {
    expect(service).toBeTruthy();
  });

  describe('listAllPlanYear', () => {
    it('makes expected calls', () => {
      const httpTestingController = TestBed.get(HttpTestingController);
      service.listAllPlanYear().subscribe(res => {
        expect(res).toEqual();
      });
      const req = httpTestingController.expectOne('HTTP_ROUTE_GOES_HERE');
      expect(req.request.method).toEqual('GET');
      req.flush();
      httpTestingController.verify();
    });
  });

  describe('listAllSubNetworkName', () => {
    it('makes expected calls', () => {
      const httpTestingController = TestBed.get(HttpTestingController);
      service.listAllSubNetworkName().subscribe(res => {
        expect(res).toEqual();
      });
      const req = httpTestingController.expectOne('HTTP_ROUTE_GOES_HERE');
      expect(req.request.method).toEqual('GET');
      req.flush();
      httpTestingController.verify();
    });
  });

  describe('getDataForExcelReport', () => {
    it('makes expected calls', () => {
      const httpTestingController = TestBed.get(HttpTestingController);
      service.getDataForExcelReport().subscribe(res => {
        expect(res).toEqual();
      });
      const req = httpTestingController.expectOne('HTTP_ROUTE_GOES_HERE');
      expect(req.request.method).toEqual('GET');
      req.flush();
      httpTestingController.verify();
    });
  });
});
