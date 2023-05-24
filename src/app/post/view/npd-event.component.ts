import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ViewChildren, QueryList, } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import { ClrDatagrid, ClrDatagridFilterInterface, ClrDatagridColumn } from '@clr/angular';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClrDatagridSortOrder } from '@clr/angular';

import { EventsService } from '../../services/NPDEvent.service';
import { DetailsDialogComponent } from './details-dialog/details-dialog.component';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver';
import { formatDate } from "@angular/common";
import * as moment from 'moment';

@Component({
  selector: 'app-npdEvent',
  templateUrl: './npd-event.component.html',
  styleUrls: ['./npd-event.component.css']
  
})
export class NPDEventComponent implements OnInit {

  currentY1 = new Date().getFullYear() + 1;
  
  constructor(
    private sanitizer: DomSanitizer,
    private eventsService: EventsService,
    public dialog: MatDialog
  ) { }

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  messages = [];
  dataSource: any;
  baseSource: any;
  exportData: any
  currentMessage: any;

  selectedRecord;

  displayedColumns = ['TransactionID', 'EventIdentifier', 'EventEntity', 'EventName', 'EventTime', 'Action'];

  data :any
  isLoading = false;
  loading = false;
  selected: any
  
  selectedProduct: any;

  eventIdentifierTxt: any;


  ngOnInit(): void {

    console.log('Initializing....');
    this.selected = "1";
    this.selectedProduct = "MI";
    this.getEvents(this.selectedProduct, this.selected);
     
  }

  @ViewChildren(ClrDatagridColumn) columns: QueryList<ClrDatagridColumn>;

  downloadJsonHref;

  //get Events Data from backend service, and passing to Html template
  getEvents(product, days) {
    
    this.isLoading = true
    this.eventsService.getEvents(product, days).subscribe(res => {
        this.data = res
        this.dataSource = this.data
        this.baseSource = this.data
        this.exportData = this.data
        console.log(this.dataSource)
        
      const filterValue = (<HTMLInputElement>document.getElementById("filterInput")).value;
      this.dataSource = this.baseSource;
      this.dataSource = this.filterByValue(this.dataSource, filterValue)
      this.isLoading = false
    })
  }

  //get Events Data from backend service with filters already applied, then passing to Html template
  getFilteredEvents(product, days) {
    
    this.isLoading = true
    this.eventsService.getEvents(product, days).subscribe(res => {
        this.data = res
        this.dataSource = this.data
        this.baseSource = this.data
        this.exportData = this.data
      console.log(this.dataSource)

      const filterValue = (<HTMLInputElement>document.getElementById("filterInput")).value;
      this.dataSource = this.baseSource;
      this.dataSource = this.filterByValue(this.dataSource, filterValue)
      this.isLoading = false
    })
  }

  //get individually Event Data from backend service, and displaying the data in a new modal screen
  getDetails(product, transactionID) {
    this.loading = true;
    this.eventsService.getEventsDetails(product, transactionID).subscribe(res  => {
      this.currentMessage = res[0];
      this.openDialog();
    });
  }

  //Modal config
  openDialog(): void {
    const dialogRef = this.dialog.open(DetailsDialogComponent, {
      width: '800px',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: this.currentMessage
    })
    this.loading = false;
  }

  //converting the selected Event data into Json file format
  generateDownloadJsonUri(product, transactionID) {
    this.eventsService.getEventsDetails(product, transactionID).subscribe(res  => {
        var sJson = JSON.stringify(res);
        var element = document.createElement('a');
        element.setAttribute('href', "data:text/json;charset=UTF-8," + escape(sJson));
        element.setAttribute('download', transactionID +".json");
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click(); // simulate click
        document.body.removeChild(element);
    })
  }

  //Reading filter input
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource = this.baseSource;
    this.dataSource = this.filterByValue(this.dataSource, filterValue)
  }

  //Array comparison
  filterByValue(array, string) {
    return array.filter(o =>
        Object.keys(o).some(k => o[k].toLowerCase().includes(string.toLowerCase())));
  }

  //Excel blob Data conversion and config
  exportExcel() {
    
    this.exportData = this.exportData.map(props => {
      return {
        TransactionID: props.transactionID,
        EventIdentifier: props.eventIdentifier,
        EventEntity: props.eventEntity,
        EventName: props.eventName,
        EventTime: props.eventTime
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(this.exportData);
   
    var wscols = [
      { wch: 45 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 }
    ];

    worksheet['!cols'] = wscols;

    XLSX.utils.sheet_add_json(worksheet, this.exportData, {skipHeader: true, origin: "A2"});

    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, "Events");
}

//Excel file formating and downloading
saveAsExcelFile(buffer: any, fileName: string): void {

  let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  let EXCEL_EXTENSION = '.xlsx';
  const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
  });
  const date = new Date();
  const dateEST = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
  })

  let formatedDate = moment(dateEST).format('MMDDYYYYHHmmss')
 
  let milliseconds = date.getMilliseconds();

  const firstTwoChars = String(milliseconds).substring(0, 2);

  saveAs(data, fileName + '_' + formatedDate + firstTwoChars + EXCEL_EXTENSION);

}
}


  
  


