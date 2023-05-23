import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { range, uniqWith, isEqual, orderBy } from 'lodash';
import { MedicareIndividualBDWService } from 'src/app/services/medicare-individual-bdw.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExcelService } from 'src/app/services/sharedServices/excel-services/excel-export-service/excel.service';
import { ConnectureService } from '../connecture.service';
import { MessageService } from 'primeng/api';

interface Year {
  name: string;
  value: number;
}

interface RxCode {
  name: string;
  value: number;
}

const currentYearPlus1 = moment().year() + 1;
const currentYearPlus1Minus10 = currentYearPlus1 - 4;

@Component({
  selector: 'connecture',
  templateUrl: 'connecture.component.html',
  styleUrls: ['./connecture.component.scss'],
  providers: [MessageService]
})

export class ConnectureComponent implements OnInit {

  yearItems: Year[] = [];
  rxCodesItems: RxCode[] = [];

  defaultYear: Year = { name: currentYearPlus1.toString(), value: currentYearPlus1 };

  data: any[];
  loading: boolean = false;
  isLoading: boolean = false;
  planYear: Year = this.defaultYear;
  _rxCodes: RxCode[] = [];

  connectureFormGroup: FormGroup = this.fb.group({
    planYear: [null, Validators.required],
    rxCode: [null, Validators.required],
  });


  constructor(
    private fb: FormBuilder,
    private service: ConnectureService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.yearItems = range(currentYearPlus1, currentYearPlus1Minus10, -1).map(year => ({ name: year.toString(), value: year }))
    this.getRxCodeData(this.defaultYear.value)
  }

  //endpoint call for rxCodes data, parameter: plan Year
  getRxCodeData(year) {

    this.isLoading = true;
     this.service.getRxCode(year).subscribe((data: any) => {

      let groupedData = data.map(props => {
        return {
          name: props,
          value: props
        };
      });

      this.rxCodesItems = orderBy(groupedData, 'value', 'asc');
      this.isLoading = false;
    });  
  }

  @Input() get rxCode(): RxCode[] {
    return this._rxCodes;
  }

  set rxCode(value: RxCode[]) {
    this._rxCodes = orderBy(value, 'value', 'asc');
  }

  //this function will trigger when a planYear value is changed
  onChangeYear(year) {
    this.getRxCodeData(year.value);
    this._rxCodes = [];
  }

  //RxCode field validation for empty value
  isEmpty() {
    return !(this._rxCodes && this._rxCodes.length > 0);
  }

  //fields validation for empty and touched status
  validateField(field) {
    const form = this.connectureFormGroup.controls[field];
    return form.status === 'INVALID' && form.touched;
  }

  //reset rxCode validation status
  resetValidation() {
    this.connectureFormGroup.controls.rxCode.markAsUntouched();
    this.connectureFormGroup.controls.rxCode.markAsPristine();
  }

  //this function will trigger Reports generation
  submit() {
    this.loading = true;
    let year = this.connectureFormGroup.controls.planYear.value.value;
    let groupedRxCodes = []
    this._rxCodes.forEach(key => {
      groupedRxCodes.push(key.value); // 1
    });
   
    this.generateGPIReport(year,groupedRxCodes)

  }

  //function for reset button, will set default values
  clear() {
    this.getRxCodeData(this.defaultYear.value);
    this.planYear = this.defaultYear;
    this._rxCodes = [];
    this.resetValidation();
  }

  //message configuration
  messageDisplay(key:string,severity:string,summary:string,detail:string ): void {
    this.messageService.clear();
    this.messageService.add({
      key: key,
      severity: severity,
      summary: summary,
      detail: detail,
      sticky: true,
    });
  }

  //this function will generate GPI report
  generateGPIReport(year, rxCodes) {

    let responseGPI = this.service.generateGPIReport(year, rxCodes)
    responseGPI.subscribe((response) => {

      let message = "✔️ GPI Report generation has been completed. <br>"
      this.generateDCBCReport(message, 'success', year, rxCodes);


    }, error => {
      if (error.error == "Site Disabled") {
        let errormessage = "500 SERVER ERROR, unable to connect to Azure."
        this.messageDisplay('error', 'error', 'Error!', errormessage);
      }
      else if (error.error == "Service Unavailable") {
        let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
        this.messageDisplay('error', 'error', 'Error!', errormessage);
      }
      else if (error.status == 400) {
        let errormessage = "⚠️ GPI Report generation is " + error.error.message + ". <br>"
        this.generateDCBCReport(errormessage, 'failure', year, rxCodes);
      }
      else if (error.status == 0) {
        let errormessage = "500 SERVER ERROR, unable to connect to server."
        this.messageDisplay('error', 'error', 'Error!', errormessage);
      }
    })


  }   
      
  //this function will generate DCBC report
  generateDCBCReport(message, status, year, rxCodes) {

    let responseDCBC = this.service.generateDCBCReport(year, rxCodes)
    responseDCBC.subscribe(report => {

      let warningMessages = message + '✔️ DC-BC Report generation has been completed.';
      if (status === 'success') {
        this.messageDisplay('success', 'success', 'Success!', warningMessages);
        this.loading = false;
      } else {
        this.messageDisplay('error', 'error', 'Error!', warningMessages);
        this.loading = false;
      }


    }, error => {
      if (error.status == 500) {
        let warningMessages = message + '⚠️ DC-BC Report generation failed.';
        this.messageDisplay('error', 'error', 'Error!', warningMessages);
        this.loading = false;
      }
      else if (error.error == "Service Unavailable") {
        let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
        this.messageDisplay('error', 'error', 'Error!', errormessage);
      }
      else if (error.status == 400) {
        let warningMessages = message + '⚠️ DC-BC Report generation is ' + error.error + ".";
        this.messageDisplay('error', 'error', 'Error!', warningMessages);
        this.loading = false;
      }
      else if (error.status == 0) {
        let errormessage = "500 SERVER ERROR, unable to connect to server."
        this.messageDisplay('error', 'error', 'Error!', errormessage);
      }
    })

  }

}