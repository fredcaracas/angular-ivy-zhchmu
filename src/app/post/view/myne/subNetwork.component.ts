import {
  Component,
  OnInit,
  QueryList,
  ViewChildren,
  ViewChild,
  Input,
  ChangeDetectorRef,
  ViewEncapsulation,
  ElementRef
} from '@angular/core';
import * as XLSX from 'xlsx';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { of as observableOf, of } from 'rxjs/observable/of';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { AddnewpopupComponent } from '../../../components/popup-dialog-alert-box/addnewpopup/addnewpopup.component';
import { CancelpopupComponent } from '../../../components/popup-dialog-alert-box/cancelpopup/cancelpopup.component';
import { MatTab, MatTabGroup, MatTabChangeEvent } from '@angular/material/tabs';
import { ClrDatagrid, ClrDatagridFilterInterface, ClrDatagridColumn } from '@clr/angular';

import { SubNetworkService } from '../subNetwork.service';
import { LocalService } from '../../../services/localstorage_encryption/local.service';
import { ClrDatagridSortOrder } from '@clr/angular';
import { SharedService } from 'src/app/services/sharedServices/play-book-service/shared.service'

import { ExcelService } from '../../../services/sharedServices/excel-services/excel-export-service/excel.service';
import { Users } from './Users';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { FieldTypeFilter } from 'src/app/utility/local-storage-management/util.filters';
import { LocalStorageService } from 'src/app/utility/local-storage-management/local-storage.service';
import { Router } from '@angular/router';
import { RecordSaveComponent } from 'src/app/components/popup-dialog-alert-box/record-save/record-save.component';
import { RecordCancelComponent } from 'src/app/components/popup-dialog-alert-box/record-cancel/record-cancel.component';
import { interval, Observable, Subscription } from 'rxjs';
import { EditSubNetworkComponent } from '../edit-subNetwork/edit-subNetwork.component';

export class LobFilter implements ClrDatagridFilterInterface<Users> {
  public selectedColors: string[] = [];

  public changes = new Subject<any>();

  public isActive(): boolean {
    return this.selectedColors.length > 0;
  }

  public accepts(user: Users): boolean {
    return this.selectedColors.indexOf(user.Policy.toLocaleLowerCase()) > -1;
  }
}


let policyType = ['Group', 'Individual'];
let networkType = ['Facility', 'Physician']

@Component({
  selector: 'app-subNetwork',
  templateUrl: './subNetwork.component.html',
  styleUrls: ['./subNetwork.component.css']
})
export class searchSubNetworkComponent implements OnInit {
  selectedRecord;
  currentYear: any;
  minDate: Date;
  maxDate: Date;
  minTime: any;
  startDate = new FormControl(new Date("01/01/" + new Date().getFullYear()));
  endDate = new FormControl(new Date("12/31/2099"));
  htmlToAdd: any;
  isLoading = false;
  isLoadingTable = false;

  constructor(
    public service: SubNetworkService,
    public shared: SharedService, private router: Router,
    public dialog: MatDialog,
    public localStorage: LocalStorageService

  ) {
    this.customLOBFilter = new LobFilter();
    this.minDate = new Date("01/01/" + new Date().getFullYear());
    this.maxDate = new Date("12/31/2099");

  }

  ngOnInit() {
    console.log("initial")
    this.currentYear = moment().year() + 1;
    this.planYearData();
    this.getPlansData(this.currentYear, "Group");
    this.addNewBBIPBM();

  }


  //private fieldTypeFilter = new FieldTypeFilter; 
  @ViewChildren(ClrDatagridColumn) columns: QueryList<ClrDatagridColumn>;

  customLOBFilter: LobFilter;
  toggleSelection(event: any) {
    if (event.target.checked) {
      this.customLOBFilter.selectedColors.push(event.target.value);
    } else {
      const colorName = event.target.value;
      const index = this.customLOBFilter.selectedColors.indexOf(colorName);
      if (index > -1) {
        this.customLOBFilter.selectedColors.splice(index, 1);
      }
    }
    this.customLOBFilter.changes.next(true);
  }
  hideTable = false;
  bbiid: string
  loading: boolean = false;
  validate: boolean = false;
  descSort = ClrDatagridSortOrder.DESC;

  alertpopup(errormessage) {
    console.log("check errormessage", errormessage)
    const dialogRef = this.dialog.open(RecordSaveComponent, {
      height: '180px',
      width: '600px',
      disableClose: true, data: "⚠️" + errormessage
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
      this.isLoading = false;

    });

  }
  cancelpopup() {
    const dialogRef = this.dialog.open(RecordCancelComponent, {
      height: '180px',
      width: '600px',
      data: "⚠️ Are you sure, you want to Cancel?",
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Confirm') {
        this.resetForm();
        this.removeTab2();
      }
    });
  }
  check1 = false;
  resetForm() {
    this.check1 = true;
    this.options.resetModel();
    this.form.get('planID').reset();
    this.form.get('planOption').reset();
    let policy = this.form.get('policyType');
    policy.setValue('Group')
    let planyear = this.form.get('planYear');
    planyear.setValue(this.currentYear)
    this.form.get('subNetworkName').reset();
    this.form.get('subNetwork').reset();
    this.startDate = new FormControl(new Date("01/01/" + new Date().getFullYear()));
    this.endDate = new FormControl(new Date("12/31/2099"));
    setTimeout(() => { this.check1 = false; }, 3000);

  }



  @ViewChild(MatTabGroup, { read: MatTabGroup })
  public tabGroup: MatTabGroup;
  @ViewChildren(MatTab, { read: MatTab })
  public tabNodes: QueryList<MatTab>;
  public closedTabs = [];
  public tabs = [];

  closeTab(index: number) {
    event.stopPropagation();
    this.closedTabs.push(index);
    this.tabGroup.selectedIndex = this.tabNodes.length - 1;
  }

  onclick(index) {
    if (index == 0) {
      this.hideTable = true;
      this.loading = true;
      this.searchData();
    }
  }

  dataSource = [];
  spinner = false;
  year_data = [];
  public planYearData() {
    this.spinner = true;
    let resp = this.service.listAllPlanYear();
    resp.subscribe(report => {
      this.year_data = report as SubNetworkService[];

    });

  }

  plans_Data = [];
  public getPlansData(year, policy) {

    if (policy == "Group") {

      let resp = this.service.listAllPlanOption(year)
      resp.subscribe(report => {
        this.plans_Data = report as SubNetworkService[];
        //this.spinner = false;
      });

    } else {

      let resp = this.service.listAllPlanID(year)
      resp.subscribe(report => {
        this.plans_Data = report as SubNetworkService[];
        //this.spinner = false;
      });

    }
    this.spinner = false;
    this.addDataPBM();

  }

  getAllSubNetworkNames() {
    let resp = this.service.listAllSubNetworkName()
    resp.subscribe(report => {
      this.subNetworkName_Data = report as SubNetworkService[];
    });
  }

  //searchData

  dataSource1: any;
  emptyresp: any;
  serviceCategoryParams: any;
  serviceReasonParams: any;
  checkdb: any
  users = [];
  users$: Observable<any>;
  public TabIndex = 1;
  public searchData() {

    this.isLoadingTable = true;
    this.loading = true;
    this.hideTable = true;
    this.dataSource1 = []
    //this.columns.forEach(column => column.filterValue = null);
    if ((this.model_search.planYear != "" && this.model_search.policyType != "") &&
      (this.model_search.planYear != undefined && this.model_search.policyType != undefined)) {

      let resp = this.service.getSubnetworks(this.model_search.planYear, this.model_search.policyType, this.model_search.plans);
      resp.subscribe(report => {
        this.users = report as SubNetworkService[];
        console.log(this.users)
        this.isLoadingTable = false;
        this.loading = false;

      });

    }

    //this.hideTable = false
    this.loading = false
  }

  serviceNamefilter(val, ser) {
    // this.r1=this.serviceName.filter(item=> item!==val);

    if (ser !== undefined) {
      return ser.filter(item => item !== val)
    }
  }

  valueChangesUnsubscribe = () => { };
  form = new FormGroup({});
  searchModel: any = {};
  model: any = {};
  options: FormlyFormOptions = {
    formState: {
      disabled: true,
    },
  };

  //MF2 : ADD NEW BBI
  fields: FormlyFieldConfig[];

  planID_Data: any;
  planOption_Data: any;
  subNetworkName_Data: any;

  public addNewBBIPBM() {
    const date = new Date();
    const cYear = date.getFullYear();
    this.fields = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Policy Type:</p>',
          },
          {
            className: 'col-md-4',
            key: 'policyType',
            type: 'typeaheadcas',
            defaultValue: 'Group',
            templateOptions: {
              label: 'Policy Type *',
              placeholder: 'Policy Type',
              labelPosition: 'floating',
              description: "Policy Type",
              search$: term => {
                if (!term || term === '') {
                  return observableOf(policyType);
                }
                return observableOf(
                  policyType
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)

                );
              },
              required: true,
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('policyType').valueChanges.subscribe(resP => {
                  if (this.model.policyType === null) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          },
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Plan Year:</p>',
          },
          {
            className: 'col-md-4',
            key: 'planYear',
            type: 'typeaheadcas',
            defaultValue: this.currentYear,
            templateOptions: {
              label: "Plan Year *",
              placeholder: 'Plan Year',
              description: "Plan Year",
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.year_data);
                }

                return observableOf(
                  this.year_data
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)

                );
              },
              required: true,
              loading: this.spinner,
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('planYear').valueChanges.subscribe(resP => {
                  if (this.model.planYear === null) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          },
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Plan ID:</p>',
          },
          {
            className: 'col-md-4',
            key: 'planID',
            type: 'typeaheadcas',
            templateOptions: {
              label: "Plan ID *",
              placeholder: 'Plan ID',
              description: 'Plan ID',
              required: true,
              loading: this.loading,
              disabled: true,
              search$: term => {
                if (!term || term === null) {
                  return observableOf(this.planID_Data)
                }
                return observableOf(
                  this.planID_Data
                    .filter(v => v.indexOf(term) > -1)
                );
              },
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {

                if (this.model.planYear === null) {
                  field.form.get('planYear').value.templateOptions.requiredCheck = true;
                  field.templateOptions.search$ = false;
                } else {
                  this.loading = true
                  let planYearVal = this.model.planYear
                  let resp = this.service.listAllPlanID(planYearVal);
                  resp.subscribe(revision => {
                    this.planID_Data = revision as SubNetworkService[];
                    this.planID_Data.sort();
                    this.loading = false;
                    field.templateOptions.search$ = term => {
                      if (!term || term === null) {
                        return observableOf(this.planID_Data);
                      }
                      return observableOf(
                        this.planID_Data
                          .filter(v => v.indexOf(term) > -1)
                      );
                    }
                  })
                }


              },
              onChanges: (field) => {
                field.form.get('policyType').valueChanges.subscribe(resp => {
                  if (this.model.policyType === 'Individual') {
                    field.templateOptions.disabled = false;
                    field.templateOptions.requiredCheck = false;
                  } else {
                    field.templateOptions.disabled = true;
                    field.templateOptions.requiredCheck = false;
                  }
                })

                field.form.get('planID').valueChanges.subscribe(resp => {
                  if (this.model.planID != null) {
                    field.templateOptions.requiredCheck = false;
                  } else {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;

                  }
                })

                field.form.get('planYear').valueChanges.subscribe(res => {
                  if (this.model.planYear === null) {
                    field.form.get('planYear').value.templateOptions.requiredCheck = true;
                    field.templateOptions.search$ = false;
                  } else {
                    this.loading = true;
                    let planYearVal = this.model.planYear
                    let resp = this.service.listAllPlanID(planYearVal);
                    resp.subscribe(revision => {
                      this.planID_Data = revision as SubNetworkService[];
                      this.planID_Data.sort();
                      this.loading = false;
                      field.templateOptions.search$ = term => {
                        if (!term || term === null) {
                          return observableOf(this.planID_Data);
                        }
                        return observableOf(
                          this.planID_Data
                            .filter(v => v.indexOf(term) > -1)
                        );
                      }
                    })
                  }
                })
              }
            }
          }
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Plan/Option:</p>',
          },
          {
            className: 'col-md-4',
            key: 'planOption',
            type: 'typeaheadcas',
            templateOptions: {
              label: "Plan Option *",
              placeholder: 'Plan Option',
              description: 'Plan Option',
              required: true,
              loading: this.loading,
              //disabled: true,
              search$: term => {
                if (!term || term === null) {
                  return observableOf(this.planOption_Data)
                }
                return observableOf(
                  this.planOption_Data
                    .filter(v => v.indexOf(term) > -1)
                );
              },
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {

                if (this.model.planYear === null) {
                  field.form.get('planYear').value.templateOptions.requiredCheck = true;
                  field.templateOptions.search$ = false;
                } else {
                  this.loading = true;
                  let planYearVal = this.model.planYear
                  let resp = this.service.listAllPlanOption(planYearVal);
                  resp.subscribe(revision => {
                    this.planOption_Data = revision as SubNetworkService[];
                    this.loading = false;
                    field.templateOptions.search$ = term => {
                      if (!term || term === null) {
                        return observableOf(this.planOption_Data);
                      }
                      return observableOf(
                        this.planOption_Data
                          .filter(v => v.indexOf(term) > -1)
                      );
                    }
                  })
                }


              },
              onChanges: (field) => {
                field.form.get('policyType').valueChanges.subscribe(resp => {
                  if (this.model.policyType == 'Group') {
                    field.templateOptions.disabled = false;
                    field.templateOptions.requiredCheck = false;
                  } else {
                    field.templateOptions.disabled = true;
                    field.templateOptions.requiredCheck = false;
                  }
                })

                field.form.get('planOption').valueChanges.subscribe(resp => {

                  if (this.model.planOption != null) {
                    field.templateOptions.requiredCheck = false
                  } else {
                    field.templateOptions.requiredCheck = true
                  }
                })

                field.form.get('planYear').valueChanges.subscribe(res => {

                  if (this.model.planYear === null) {
                    field.form.get('planYear').value.templateOptions.requiredCheck = true;
                    field.templateOptions.search$ = false;
                  } else {
                    this.loading = true;
                    let planYearVal = this.model.planYear
                    let resp = this.service.listAllPlanOption(planYearVal);
                    resp.subscribe(revision => {
                      this.planOption_Data = revision as SubNetworkService[];
                      this.loading = false;
                      field.templateOptions.search$ = term => {
                        if (!term || term === null) {
                          return observableOf(this.planOption_Data);
                        }
                        return observableOf(
                          this.planOption_Data
                            .filter(v => v.indexOf(term) > -1)
                        );
                      }
                    })
                  }
                })
              }
            }
          }
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Sub Network Name:</p>',
          },
          {
            className: 'col-md-4',
            key: 'subNetworkName',
            type: 'typeaheadcas',
            templateOptions: {
              label: "Sub Network Name *",
              placeholder: 'Sub Network Name ',
              description: 'Sub Network Name',
              required: true,
              search$: term => {
                if (!term || term === null) {
                  return observableOf(this.subNetworkName_Data)
                }
                return observableOf(
                  this.subNetworkName_Data
                    .filter(v => v.indexOf(term) > -1)
                );
              },
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {

                this.loading = true;
                let resp = this.service.listAllSubNetworkName();
                resp.subscribe(revision => {
                  this.subNetworkName_Data = revision as SubNetworkService[];
                  this.loading = false;
                  field.templateOptions.search$ = term => {
                    if (!term || term === null) {
                      return observableOf(this.subNetworkName_Data);
                    }
                    return observableOf(
                      this.subNetworkName_Data
                        .filter(v => v.indexOf(term) > -1)
                    );
                  }
                })
              },
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('subNetworkName').valueChanges.subscribe(resP => {
                  if (this.model.subNetworkName === null && this.check1 != true) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          }
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Network Type:</p>',
          },
          {
            className: 'col-md-4',
            key: 'networkType',
            type: 'typeaheadcas',
            defaultValue: 'Facility',
            templateOptions: {
              label: "Network Type *",
              placeholder: 'Network Type *',
              description: 'Network Type',
              required: true,
              search$: term => {
                if (!term || term === null) {
                  return observableOf(networkType)
                }
                return observableOf(
                  networkType
                    .filter(v => v.indexOf(term) > -1)
                );
              },
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('networkType').valueChanges.subscribe(resP => {
                  if (this.model.networkType === null) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          }
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-sm-2 offset-sm-1',
            template: '<p>Sub Network:</p>',
          },
          {
            className: 'col-md-4',
            type: 'input',
            key: 'subNetwork',
            templateOptions: {
              required: true,
              maxLength: 4,
              rows: 1,
              attributes: {
                width: '200%'
              }
            },
            validators: {
              validation: ['whitespace', 'invalidNumber'],
            },
          }
        ],
      }
    ];

  }
  tabledatainexcel = [];

  saveAsExcelFile(buffer: any, fileName: string): void {
    import("file-saver").then(FileSaver => {
      let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      let EXCEL_EXTENSION = '.xlsx';
      const PlaybookSheet: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
      });
      FileSaver.saveAs(PlaybookSheet, 'Playbook' + ' ' + 'Mapping' + ' ' + 'Report' + EXCEL_EXTENSION);

    });
  }

  exportAsXLSX() {

    this.isLoadingTable = true


    let resp = this.service.getDataForExcelReport()
    let date: Date = new Date();
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let FileName = 'NPD-' + 'Subnetwork-Maintenance' + '-' + month + '_' + day + '_' + year + '.xlsx';
    resp.subscribe(report => {
      this.dataSource1 = report as SubNetworkService[];

      let rows = this.dataSource1;
      let element = document.getElementById('excel-table');
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
      var wscols = [
        { wch: 10 },
        { wch: 10 },
        { wch: 25 },
        { wch: 40 },
        { wch: 13 },
        { wch: 13 },
        { wch: 18 },
        { wch: 18 }
      ];

      ws['!cols'] = wscols;

      /* generate workbook and add the worksheet */
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subnetwork Maintenance');

      /* save to file */
      XLSX.writeFile(wb, FileName);

      this.isLoadingTable = false
    });


  }

  files: any;
  fileToUpload: any;
  readDataFromFile: any;
  selectedFile: any;
  ImportAsXLSX(file: File) {
    // console.log('entered upload',file);
    this.selectedFile = true;
    this.fileToUpload = file[0];
    this.files = file.name;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      // console.log('file name', event.target.result,this.fileToUpload);
      // let ImageUrl = event.target.result;
      this.readDataFromFile = event.target.result;
      // console.log('sfsdfsdf', reader.readAsText(this.fileToUpload));
    };
    reader.readAsText(this.fileToUpload);
    // this.onBrowse();
  }
  public addDataPBM() {
    this.fields_search = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-4',
            key: 'planYear',
            type: 'typeaheadcas',
            defaultValue: this.currentYear,
            templateOptions: {
              label: "Plan Year *",
              placeholder: 'Plan Year',
              description: "Plan Year",
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.year_data);
                }

                return observableOf(
                  this.year_data
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)

                );
              },
              required: true,
              loading: this.spinner,
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('planYear').valueChanges.subscribe(resP => {
                  if (this.model_search.planYear === null) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          },
          {
            className: 'col-md-4',
            key: 'policyType',
            type: 'typeaheadcas',
            defaultValue: 'Group',
            templateOptions: {
              label: 'Policy Type *',
              placeholder: 'Policy Type',
              labelPosition: 'floating',
              description: "Policy Type",
              search$: term => {
                if (!term || term === '') {
                  return observableOf(policyType);
                }
                return observableOf(
                  policyType
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)

                );
              },
              required: true,
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form.get('policyType').valueChanges.subscribe(resP => {
                  if (this.model_search.policyType === null) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.loading = false;
                  } else {
                    field.templateOptions.requiredCheck = false
                  }
                })
              },
            }
          },
          {
            className: 'col-md-4',
            key: 'plans',
            type: 'typeaheadmul',
            templateOptions: {
              label: 'Plan/Option',
              placeholder: 'Plan/Option',
              labelPosition: 'floating',
              loading: this.spinner,
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.plans_Data);
                }
                return observableOf(
                  this.plans_Data
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)

                );
              },
            },
            hooks: {
              onChanges: (field) => {

                field.form.get('policyType').valueChanges.subscribe(resP => {

                  if (this.model_search.policyType != null && this.model_search.policyType === "Individual") {
                    field.templateOptions.label = "PlanID"
                    field.templateOptions.placeholder = "PlanID"
                    if (this.model_search.planYear != null) {
                      this.getPlansData(this.model_search.planYear, this.model_search.policyType);
                    }

                  } else {
                    field.templateOptions.label = "Plan/Option"
                    field.templateOptions.placeholder = "Plan/Option"
                    if (this.model_search.planYear != null) {
                      this.getPlansData(this.model_search.planYear, this.model_search.policyType);
                    }
                  }
                })

                field.form.get('planYear').valueChanges.subscribe(resP => {

                  if (this.model_search.policyType != null && this.model_search.planYear != null) {

                    this.getPlansData(this.model_search.planYear, this.model_search.policyType);

                  }
                })


              },
            }
          }
        ]
      }
    ];
  }

  openDialogEdit() {

    const dialogRef = this.dialog.open(EditSubNetworkComponent, {
      data: this.selectedRecord,
      width: '100%',
      height: '85%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.searchData();
    });
  }

  submit() {
    //alert(JSON.stringify(this.model));
  }



  form_search = new FormGroup({});
  model_search: any = {};
  options_search: FormlyFormOptions = {
    formState: {
      disabled: true,
    },
  }
  fields_search: FormlyFieldConfig[];

  @ViewChild('dg', { static: true }) datagrid: ClrDatagrid;
  @Input('searchOption') searchOp: string;

  tabs1 = ['Search', 'Add New SubNetwork'];
  tabs2 = ['Search']

  editButtonS = false;
  mail;
  secPt;


  setOverrideSec(secPT) {
    //secPT = true;
    if (secPT === true) {
      this.editButtonS = true;
      //this.tabs1 = ['Search'];
    }  //member from ReadOnly group, hide editB
    else {
      this.editButtonS = false;     //i.e. member not from readonly, show editB
    }



    console.log(this.editButtonS, "final");

  }

  temp: any = [];

  clearSelection() {
    this.datagrid.selection.current = [];
  }

  selected = new FormControl(0);

  addTab() {
    console.log("Entro")
    this.removeTab(2);
    this.tabs1.push('Add Sub Network Names');
    //this.historydata(id, BBIID);
    this.selected.setValue(this.tabs1.length - 1);

  }

  addTab2(selectAfterAdding: boolean, id: string, BBIID: string) {

    this.removeTab(1);
    this.tabs2.push('View BBI History');
    //this.historydata(id, BBIID);

    if (selectAfterAdding) {
      this.selected.setValue(this.tabs2.length - 1);
    }
  }

  removeTab(index: number) {
    this.tabs1.splice(index, 1);
    this.tabs2.splice(index, 1);
    this.selected.setValue(0);
    //this.selected.setValue(1);
    this.hideTable = true
    //this.searchData();
  }

  removeTab2() {
    //this.tabs1.splice(index, 1);
    this.selected.setValue(0);
    // this.onclick();
    this.hideTable = true
    this.searchData();

  }
  tabchange: boolean
  onTabChange(event: MatTabChangeEvent) {

    console.log("event", event)
    if (event.index == 1) {
      this.getAllSubNetworkNames();
    }

    if (this.editButtonS) {
      console.log("if");

      if (event.index == 2) {
        this.tabchange = true
      }
      if (event.index == 0 && this.tabchange == true) {
        this.searchData();
        this.tabchange = false
      }
      if (event.index == 1) {
        this.tabchange = false
      }
    } else {
      if (event.index == 0) {
        this.searchData();
      }
    }



  }

  addSubNetwork(pker1, pker2) {

    this.isLoading = true
    let date1 = new Date(pker1)
    let date2 = new Date(pker2)

    if (date1 > date2) {

      let errormessage = "Effective Date cannot be greater than Term Date."
      this.alertpopup(errormessage);

    } else {

      if (this.model.policyType == "Group") {

        let data = {

          "Policy": this.model.policyType,
          "PlanYear": this.model.planYear,
          "Plan": this.model.planOption,
          "SubnetworkName": this.model.subNetworkName,
          "NetworkType": this.model.networkType,
          "SubNetwork": this.model.subNetwork,
          "EffectiveDate": pker1,
          "TermDate": pker2

        }

        let resp = this.service.addSubnetwok(data)

        resp.subscribe(res => {

          const dialogRef = this.dialog.open(RecordSaveComponent, {
            height: '180px',
            width: '600px',
            disableClose: true,
            data: "✔️ New Sub Network has been saved."
          });

          dialogRef.afterClosed().subscribe(result => {
            this.dialog.closeAll();
            this.isLoading = false;
            this.resetForm();
          });

        }, error => {
          if (error.error == "Site Disabled") {
            let errormessage = "500 SERVER ERROR, unable to connect to Azure."
            this.alertpopup(errormessage);
          }
          else if (error.error == "Service Unavailable") {
            let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
            this.alertpopup(errormessage);
          }
          else if (error.status == 404) {
            let errormessage = "500 SERVER ERROR, unable to connect to Database."
            this.alertpopup(errormessage);
          }
          else if (error.status == 0) {
            let errormessage = "500 SERVER ERROR, unable to connect to server."
            this.alertpopup(errormessage);
          }
        })

      } else {

        let data = {

          "Policy": this.model.policyType,
          "PlanYear": this.model.planYear,
          "Plan": this.model.planID,
          "SubnetworkName": this.model.subNetworkName,
          "NetworkType": this.model.networkType,
          "SubNetwork": this.model.subNetwork,
          "EffectiveDate": pker1,
          "TermDate": pker2

        }

        let resp = this.service.addSubnetwok(data)

        resp.subscribe(res => {

          const dialogRef = this.dialog.open(RecordSaveComponent, {
            height: '180px',
            width: '600px',
            disableClose: true,
            data: "✔️ New Sub Network has been saved."
          });

          dialogRef.afterClosed().subscribe(result => {
            this.dialog.closeAll();
            this.isLoading = false;
            this.resetForm();
          });

        }, error => {
          if (error.error == "Site Disabled") {
            let errormessage = "500 SERVER ERROR, unable to connect to Azure."
            this.alertpopup(errormessage);
          }
          else if (error.error == "Service Unavailable") {
            let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
            this.alertpopup(errormessage);
          }
          else if (error.status == 404) {
            let errormessage = "500 SERVER ERROR, unable to connect to Database."
            this.alertpopup(errormessage);
          }
          else if (error.status == 0) {
            let errormessage = "500 SERVER ERROR, unable to connect to server."
            this.alertpopup(errormessage);
          }
        })

      }

    }
  }

}








