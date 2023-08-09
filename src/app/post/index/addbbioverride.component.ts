import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { of as observableOf } from 'rxjs/observable/of';
import { AddbbipopupComponent } from '../../../../../components/popup-dialog-alert-box/addbbipopup/addbbipopup.component';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
//import { AddBBIOverrideService } from '../../../../../services/playbook.service';
import { AddBBIOverrideService } from 'src/app/services/addBBIOverride.service';
import { CancelpopupComponent } from '../../../../../components/popup-dialog-alert-box/cancelpopup/cancelpopup.component';
import { Content } from '@angular/compiler/src/render3/r3_ast';
import * as moment from 'moment';
import { RecordCancelComponent } from '../../../../../components/popup-dialog-alert-box/record-cancel/record-cancel.component';
import { map, delay } from 'rxjs/operators';
import { RecordSaveComponent } from 'src/app/components/popup-dialog-alert-box/record-save/record-save.component';
import { PlaybookService } from '../../../../../services/playbook.service';
import { Router } from '@angular/router';
import { range, uniqWith, isEqual, orderBy } from 'lodash';

export interface DialogData {
  BBIID: string;
  claimType: string;
  network: string;
  serviceCategory: string;
  serviceReason: string;
  treatment: string;
  id: string;
  dateDEactivated: any;
}

let lineOfBusiness = ['Group', 'Individual'];

let yesNo = ['No', 'Yes'];

let costShareTypeValues: any;

let costSharePeriodicityValues: any;

let serviceOopMaximumPeriodicityValues: any;
let maximumBenefitPeriodicityValues: any; 

let limitDescriptionValues: any ;

let limitPeriodicityValues: any 

@Component({
  selector: 'app-addbbioverride',
  templateUrl: './addbbioverride.component.html',
  styleUrls: ['./addbbioverride.component.css']
})
export class AddbbioverrideComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog,
    private service: AddBBIOverrideService,
    private playbookService: PlaybookService,
    private router: Router,
    public thisDialogRef: MatDialogRef<AddbbioverrideComponent>
  ) { }

  ngOnInit(): void {
    this.addBBIOverridePBM();
    this.limitDescriptionFun();
    this.limitPeriodicityFun();
    this.costSharePeriodicityFun();
    this.serviceOOPPeriodicityDataFun();
    this.CostShareTypeFun();
    this.planYearData()
  }

  loading = false;

  cancelpopup() {
    const dialogRef = this.dialog.open(RecordCancelComponent, {
      height: '180px',
      width: '600px',
      data: "⚠️ Are you sure, you want to Cancel?",
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Confirm') {
        this.dialog.closeAll();
      }
      if (result === 'Logout') {
        //do nothing
      }
    });
  }

  checkVr;
  checkFDown() {
    let resp = this.service.serviceOopMaximumPeriodicity();
    resp.subscribe(report => {
      this.checkVr = report as AddBBIOverrideService[];
      this.addbbipopup();
    },
      error => {
        console.log(error.status)
        if (error.error == "Site Disabled") {
          let errormessage = "500 SERVER ERROR, unable to connect to Azure."
          this.alertpopup(errormessage);
        }
        else if (error.error == "Service Unavailable") {
          let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
          this.alertpopup(errormessage);
        } if (error.status == 404) {
          let errormessage = "500 SERVER ERROR, unable to connect to Database."
          this.alertpopup(errormessage);
        }
        else if (error.status == 0) {
          let errormessage = "500 SERVER ERROR, unable to connect to server."
          this.alertpopup(errormessage);
        }
      });
  }

  newArray = []
  addbbipopup() {
    console.log(this.model);
    // const dialogRef = this.dialog.open(RecordSaveComponent, {
    //   height: '180px',
    //   width: '600px',
    //   data: "✔️ New Record is added successfully.",
    //   disableClose: true
    // });

    var options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    //FR200.08
    //this function will create bbi override objects according to plan/option values length
 
    /**
     * FR200.08
     * DF-17312: Select all functionality for planOption field
     * Dev Note: When option 'All' is selected,
     * variable selectedPlanOptions will have all planOptions Available
     * otherwise it will only have the selected ones.
     */
    let selectedPlanOptions = []
    if (this.model.planOption[0] === 'All') {
      let allplanOptionsShifted = this.allPlanOptionList.copyWithin()
      delete allplanOptionsShifted[0]
      selectedPlanOptions = allplanOptionsShifted.filter((e) => e !== undefined)
    } else {
      selectedPlanOptions = this.model.planOption
    }

    for (var i = 0; i < selectedPlanOptions.length; i++) {
      var object = {
        lineOfBusiness: this.model.lineOfBusiness,
        serviceType: this.model.serviceType,
        ruleType: this.model.ruleType,
        planOption: selectedPlanOptions[i],
        msbCode:this.model.msbCode,
        tbi: this.model.tbi1,
        costShareType: this.model.costShareType,
        costShareAmount: this.model.costShareAmount,
        costSharePeriodicity: this.model.costSharePeriodicity,
        serviceOopMaximumAmount: this.model.serviceOopMaxAmount,
        serviceOopMaximumPeriodicity: this.model.serviceOopMaximumPeriodicity,
        maximumBenefitAmount: this.model.maxBenefitAmount,
        maximumBenefitPeriodicity: this.model.maxBenefitPeriodicity,
        limitValue: this.model.limitValue,
        limitDescription: this.model.limitDescription,
        limitPeriodicity: this.model.limitPeriodicity,
        note: this.model.note,
        oop: this.model.oop,
        deductible: this.model.deductible,        
        effectiveDate: moment(this.model.effectiveDate).format('MM/DD/YYYY'),
        dateActivated: moment(this.model.dateActivated).format('MM/DD/YYYY HH:mm:ss'),
        dateDeactivated: this.model.dateDeactivated,
        
        termDate: this.model.termDate,
        overrideReason: this.model.comments
        
      }

      if (object.planOption !== undefined) {
        this.newArray.push(object)
      }

    }

    //passing the new object collection to the parameters
    var body = {
      BBIID: this.model.bbiId,
      id: this.data[0].id,
      serviceReason: this.model.serviceReason,
      serviceCategory: this.model.serviceCategory,
      network: this.model.network,
      treatment: this.data[0].treatment,
      claimType: this.model.claimType,
      bbiOverride: this.newArray
    };

    //console.log('ADD BBI OVERRIDE MODEL DATA : ', this.model.id);
    //console.log('ADD BBI OVERRIDE BODY : ', body);
    this.service.addBBIOverrideData(body).subscribe(response => {
      const dialogRef = this.dialog.open(RecordSaveComponent, {
        height: '180px',
        width: '600px',
        disableClose: true,
        data: "✔️ New Record is added successfully."
      });
      dialogRef.afterClosed().subscribe(result => {
        this.thisDialogRef.close('Confirm');
        if (result == 'Confirm') {
          this.dialog.closeAll();
        }
      });
      },
      error =>{
          if (error.status == 400) {
            let errormessage = error.error.message;
            this.alertMessage(errormessage);
          }
  });
    // dialogRef.afterClosed().subscribe(result => {
    //   this.playbookService.filter('Register click');
    //   this.thisDialogRef.close('Confirm');
    //   //console.log(`Dialog result: ${result}`);
    // });
  }
  public alertMessage(errormessage){
    const dialogRef = this.dialog.open(RecordSaveComponent, {
      height: '180px',
      width: '600px',
      disableClose: true,
      data: "⚠️" + errormessage
    });

    dialogRef.afterClosed().subscribe(result => {
      this.thisDialogRef.close('Confirm');
      if (result == 'Confirm') {
        this.dialog.closeAll();
      }
    });
  
  }

  limidDescriptionData = [];
  public limitDescriptionFun() {
    let resp = this.service.limitDescription();
    resp.subscribe(report => {
      this.limidDescriptionData = report as AddBBIOverrideService[];
      limitDescriptionValues = report;
      //this.model.costSharePeriodicity.field.templateOptions.loading = false
      //console.log(this.limidDescriptionData)
    });
  }

  limitPeriodicityData = [];
  public limitPeriodicityFun() {
    let resp = this.service.limitPeriodicity();
    resp.subscribe(report => {
      this.limitPeriodicityData = report as AddBBIOverrideService[];
      limitPeriodicityValues = report;
      //console.log(this.limitPeriodicityData)
      //this.addDataGGO();
    });
  }
  cosetShareTypeData = [];
  public CostShareTypeFun() {
    let resp = this.service.costShareType();
    resp.subscribe(report => {
      this.cosetShareTypeData = report as AddBBIOverrideService[];
      costShareTypeValues = report
      //console.log(this.limitPeriodicityData)
      //this.addDataGGO();
    });
  }

  costSharePeriodicityData = [];
  public costSharePeriodicityFun() {
    let resp = this.service.costSharePeriodicity();
    resp.subscribe(report => {
      this.costSharePeriodicityData = report as AddBBIOverrideService[];
      costSharePeriodicityValues = report;
      //this.model.costSharePeriodicity.field.templateOptions.loading = false
      //console.log(this.limitPeriodicityData)
      //this.addDataGGO();
    }, error => {
      console.log(error.status)
      if (error.error == "Site Disabled") {
        let errormessage = "500 SERVER ERROR, unable to connect to Azure."
        this.alertpopup(errormessage);
      }
      else if (error.error == "Service Unavailable") {
        let errormessage = "500 SERVER ERROR, unable to connect as Service Unavailable."
        this.alertpopup(errormessage);
      } if (error.status == 404) {
        let errormessage = "500 SERVER ERROR, unable to connect to Database."
        this.alertpopup(errormessage);
      }
      else if (error.status == 0) {
        let errormessage = "500 SERVER ERROR, unable to connect to server."
        this.alertpopup(errormessage);
      }
    });
  }

  serviceOOPPeriodicityData = [];
  public serviceOOPPeriodicityDataFun() {
    let resp = this.service.serviceOopMaximumPeriodicity();
    resp.subscribe(report => {
      this.serviceOOPPeriodicityData = report as AddBBIOverrideService[];
      serviceOopMaximumPeriodicityValues = report;
      //console.log(this.limitPeriodicityData)
      //this.addDataGGO();
    });
  }

  //MF200.08
  //this function will call a backend service and get the Data for all TBI values
  tbiData: any
  public TBI1class(lineOfBusiness) {
    this.s1 = this.service.TBI1Data(lineOfBusiness);
    this.s1.subscribe(report => {
      this.tbiData = report as PlaybookService[];
      this.tbiData.unshift("Yes", "No")//MF200.08 adding yes/no values

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
    //return this.s1
  }

  alertpopup(errormessage) {
    const dialogRef = this.dialog.open(RecordSaveComponent, {
      height: '180px',
      width: '600px',
      disableClose: true, data: "⚠️" + errormessage
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
      // if (result == "Confirm") {  
      this.dialog.closeAll();
      this.router.navigate([`\**`]);
      // }
    });

  }
  form = new FormGroup({});
  r1: any;
  r2: any;
  r3: any;
  r4: any;
  r5: any;
  t1: any;
  tb1: any;
  tbi1: any;
  to1: any;
  to2: any;
  td1: any;
  td2: any;
  s1: any;
  p1: any;
  tt1: any;
  ss1: any;
  allPlanOptionList: any;
  ld: any;
  ld1: any;
  lp: any;
  lp1: any;
  ruleType: any;
  ruleType1: any;
  mbp1: any;
  mbp: any;
  somp1: any;
  somp: any;
  csp1: any;
  csp: any;
  msbCode:any;

  model: any = {};

  options: FormlyFormOptions = {
    formState: {
      disabled: true
    }
  };
  // public addBBIOverridePBM() {
  options1 = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  fields: FormlyFieldConfig[];
  public addBBIOverridePBM() {
    const date = new Date();
    const cYear = date.getFullYear() + 1;
    this.fields = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-3',
            type: 'input',
            key: 'bbiId',
            defaultValue: this.data[0].BBIID,
            templateOptions: {
              label: 'BBI ID',
              placeholder: 'BBI ID',
              disabled: true
            }
          },
          {
            className: 'col-md-4',
            type: 'textarea',
            key: 'dateActivated',
            defaultValue: moment(new Date()).format('MM/DD/YYYY HH:mm:ss'),
            templateOptions: {
              label: 'Date Activated',
              required: false,
              readonly: true
            }
          },
          {
            className: 'col-md-4',
            type: 'textarea',
            key: 'dateDeactivated',
            // DF-17303:  The reinstated BBI Override Deactivated Date should be blank
            // Dev Note: dateActivated should be defaulted to empty when terming an override
            defaultValue: '',
            templateOptions: {
              label: 'Date Deactivated',
              required: false,
              readonly: true
            }
        }
      ]
    },
    {
      fieldGroupClassName: 'row',
      fieldGroup: [
        {
            className: 'col-md-4',
            type: 'typeaheadcas',
            key: 'lineOfBusiness',
            templateOptions: {
              label: 'Line of Business*',
              required: true,
              //loading: this.loading,

              placeholder: 'Line of Business',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(lineOfBusiness);
                }

                return observableOf(
                  lineOfBusiness
                    .filter(
                      v => v.toLowerCase().indexOf(term.toLowerCase()) > -1
                    )
                    
                )
                //.pipe(delay(1000))
              }
            },
            // validation: {
            //   messages: {
            //     required: '⚠️ Line of Business is required field'
            //   }
            // },
            hooks: {
              onChanges: field => {
                field.form
                  .get('lineOfBusiness')
                  .valueChanges.subscribe(resP => {
                    if (this.check1 === false) {
                      if (this.model.lineOfBusiness === null) {
                        field.templateOptions.required = true;
                        field.templateOptions.requiredCheck = true;
                        this.form.get('planOption').reset();
                        this.form.get('ruleType').reset();
                        this.form.get('serviceType').reset();
                        this.form.get('tbi1').reset();
                      }
                    }
                    if (this.model.lineOfBusiness != null) {
                      field.templateOptions.requiredCheck = false;
                      this.TBI1class(this.model.lineOfBusiness)//MF200.08 calling the new endpoint
                    }
                    if (this.check1 === true) {
                      field.templateOptions.requiredCheck = false;
                    }

                    this.form.get('planOption').reset();
                    // DF-17312: Select all functionality for planOption field
                    // Dev Note: When lineOfBusiness field is change, planOption field will have a default value 'All' selected
                    this.form.get('planOption').setValue(["All"]);
                    // if (
                    //   this.model.lineOfBusiness === null ||
                    //   this.model.lineOfBusiness === undefined
                    // )
                    //   this.form.get('planOption').reset();
                    if (
                      this.model.serviceType != null &&
                      this.model.serviceType != undefined
                    )
                      this.form.get('serviceType').reset();
                    if (this.model.tbi1 != null && this.model.tbi1 != undefined)
                      this.form.get('tbi1').reset();
                  });
              }
            }
          },
          {
            className: 'col-md-4',
            type: 'typeaheadcas',
            key: 'planYear',
            defaultValue: moment().year() + 1,
            templateOptions: {
              label: 'Plan Year*',
              required: true,
              //loading: this.loading,

              placeholder: 'Plan Year',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.planYear_data);
                }
              }
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form
                  .get('planYear')
                  .valueChanges.subscribe(resP => {

                    if (this.model.planYear != null) {
                      field.templateOptions.requiredCheck = false;  
                    } else if (
                      this.model.planYear === null ||
                      this.model.planYear === undefined
                    ) {
                      field.templateOptions.required = true;
                      field.templateOptions.requiredCheck = true;
                    }

                    this.form.get('planOption').reset();
                    this.form.get('planOption').setValue(["All"]);
                  });
                
              }
            }
          },
          {
            className: 'col-md-4',
            type: 'typeaheadmul',
            key: 'planOption',
            templateOptions: {
              label: 'Plan/Option*',
              required: true,
              loading: false,
              placeholder: 'Plan/Option',
              description: 'Plan/Option',
              search$: term => {
                if (!term || term === null) {
                  return observableOf(this.allPlanOptionList);
                }
                return observableOf(
                  this.allPlanOptionList
                    .filter(v => v.indexOf(term) > -1)
                );
              },
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                field.form
                  .get('lineOfBusiness')
                  .valueChanges.subscribe(resP => {
                    
                    if (this.model.lineOfBusiness != null) {
                      field.templateOptions.requiredCheck = false;
                      field.templateOptions.disabled = false;
                    }
                    field.templateOptions.loading = true;
                    if (this.model.lineOfBusiness != null &&
                      this.model.lineOfBusiness != undefined && this.model.planYear != null &&
                      this.model.planYear != undefined) {
                      
                      console.log('llama')
                        this.allPlanOptionList = this.service.planOption(
                          this.model.lineOfBusiness, this.model.planYear
                        );
                        this.allPlanOptionList.subscribe(report => {
                          
                          this.allPlanOptionList = report as AddBBIOverrideService[];
                          // DF-17312: Select all functionality for planOption field
                          // Dev Note: When lineOfBusiness field is change, the 'All' option is added on top 
                          //           of the allPlanOptionList
                          this.allPlanOptionList.unshift('All');
                          field.templateOptions.loading = false;
                          field.templateOptions.search$ = term => {
                            if (!term || term === '') {
                              return observableOf(this.allPlanOptionList);
                            }
                            return observableOf(
                              this.allPlanOptionList
                                .filter(v => v.indexOf(term) > -1)
                            );
                          };
                        });

                      

                    } 
                    
                    if (
                      this.model.lineOfBusiness === null ||
                      this.model.lineOfBusiness === undefined
                    ) {
                      field.templateOptions.loading = false;
                      field.templateOptions.required = false;
                      field.templateOptions.requiredCheck = false;
                      this.tt1 = [];
                      this.allPlanOptionList = [];
                    }
                  });

                field.form.get('planYear').valueChanges.subscribe(resP => {

                  if (this.model.lineOfBusiness != null &&
                    this.model.lineOfBusiness != undefined && this.model.planYear != null &&
                    this.model.planYear != undefined) {

                    field.templateOptions.loading = true;
                    this.allPlanOptionList = this.service.planOption(
                      this.model.lineOfBusiness, this.model.planYear
                    );
                    this.allPlanOptionList.subscribe(report => {
                      this.allPlanOptionList = report as AddBBIOverrideService[];
                      this.allPlanOptionList.unshift('All');
                      field.templateOptions.loading = false;
                      field.templateOptions.search$ = term => {
                        if (!term || term === '') {
                          return observableOf(this.allPlanOptionList);
                        }
                        return observableOf(
                          this.allPlanOptionList
                            .filter(v => v.indexOf(term) > -1)
                        );
                      };
                    });
                  }

                  if (
                    this.model.planYear === null ||
                    this.model.planYear === undefined
                  ) {
                    field.templateOptions.loading = false;
                    field.templateOptions.required = false;
                    field.templateOptions.requiredCheck = false;
                    this.tt1 = [];
                    this.allPlanOptionList = [];
                  }
                });

                field.form.get('planOption').valueChanges.subscribe(resP => {
                  this.form.get('ruleType').reset();
                  this.form.get('serviceType').reset();
                  this.form.get('tbi1').reset();
                  if (this.model.planOption === null || this.model.planOption === undefined) {
                    field.templateOptions.required = true;
                    field.templateOptions.requiredCheck = true
                  }else{
                    if (this.model.planOption.length > 0) {
                      field.templateOptions.required = false
                      field.templateOptions.requiredCheck = false
                      // DF-17312: Select all functionality for planOption field
                      // Dev Note: This is the toggling logic for the option 'All' and other planOptions
                      let defaultvalue = this.model.planOption.indexOf("All")
                      if (this.model.planOption[0] == "All" && this.model.planOption.length == 2) {
                        this.model.planOption.splice(0, 1);
                        field.form.get('planOption').setValue(this.model.planOption);
                      }
                      if (defaultvalue > 0) {
                        this.model.planOption = ["All"];
                        field.form.get('planOption').setValue(this.model.planOption);
                      }
                    }else{
                      field.templateOptions.required = true
                      field.templateOptions.requiredCheck = true
                    }
                  }                 
                });
              }
            }
          }
        ]
      },
      // {
      //   template: '&nbsp'
      // },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-5',
            type: 'input',
            key: 'serviceReason',
            defaultValue: this.data[0].serviceReason,
            templateOptions: {
              label: 'Service Reason',
              placeholder: 'Service Reason',
              disabled: true
            }
          },
          {
            className: 'col-md-5',
            type: 'input',
            key: 'serviceCategory',
            defaultValue: this.data[0].serviceCategory,
            templateOptions: {
              label: 'Service Category',
              placeholder: 'Service Category',
              disabled: true
            }
          },
          {
            className: 'col-md-2',
            type: 'input',
            key: 'network',
            defaultValue: this.data[0].network,
            templateOptions: {
              label: 'Network',
              placeholder: 'Network',
              disabled: true
            }
          }
        ]
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-10',
            type: 'input',
            key: 'pot',
            defaultValue: this.data[0].treatment,
            templateOptions: {
              label: 'Place of Treatment',
              placeholder: 'Place of Treatment',
              disabled: true
            }
          },
          {
            className: 'col-md-2',
            type: 'input',
            key: 'claimType',
            defaultValue: this.data[0].claimType,
            templateOptions: {
              label: 'Claim Type',
              placeholder: 'Claim Type',
              disabled: true
            }
          }
        ]
      },
      
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-5',
            type: 'typeaheadcas',
            key: 'ruleType',
            templateOptions: {
              placeholder: 'Rule Type',
              loading: false,
              search$: term1 => {
                if (!term1 || term1 === '') {
                  return observableOf(this.ruleType);
                }
                return observableOf(
                  this.ruleType
                    .filter(v => v.toLowerCase().indexOf(term1.toLowerCase()) > -1)
                );
              },
              required: false,
              attributes: {
                style: 'height: 50px; '
              }
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                //field.form
                //.get('lineOfBusiness')
                //.valueChanges.subscribe(resP => {
                field.templateOptions.loading = true;
                this.ruleType1 = this.service.ruleTypeData();
                this.ruleType1.subscribe(report => {
                  this.ruleType = report as AddBBIOverrideService[];
                  field.templateOptions.loading = false;
                  this.ruleType = this.ruleType.map(i => i.ruleType);
                  //this.ruleType.sort((a, b) => 0 - (a > b ? -1 : 1));
                  field.templateOptions.search$ = term => {
                    if (!term || term === '') {
                      return observableOf(this.ruleType);
                    }
                    return observableOf(
                      this.ruleType
                        .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                    );
                  };
                });
                field.form.get('ruleType').valueChanges.subscribe(resP => {
                  field.templateOptions.requiredCheck = false;
                  
                  this.form.get('serviceType').reset();
                  this.form.get('maxBenefitAmount').reset();
                  if (
                    this.model.ruleType == 'Supplemental Benefit - Paid on CAS Only' ||
                    this.model.ruleType == 'Supplemental Benefit - Any' ||
                    this.model.ruleType == 'Ancillary' ||
                    this.model.ruleType == 'Benefit Report'
                  ) {
                     this.form.get('tbi1').reset();
                  }

                  if (
                    this.model.ruleType == 'Supplemental Benefit - Paid on CAS Only' ||
                    this.model.ruleType == 'Supplemental Benefit - Any' 
                  ) {
                     this.form.get('msbCode').reset();
                  }

                });
                //});
              }
            }
          },
          {
            className: 'col-md-7',
            type: 'typeaheadcas',
            key: 'serviceType',
            templateOptions: {
              placeholder: 'Service Type',
              loading: false,
              search$: term1 => {
                if (!term1 || term1 === '') {
                  return observableOf(this.p1);
                }
                return observableOf(
                  this.p1
                    .filter(v => v.toLowerCase().indexOf(term1.toLowerCase()) > -1)
                );
              },
              //required: true,
              attributes: {
                style: 'height: 50px; '
              }
            },
           
            expressionProperties: {
              // model => !model.ruleType
              'templateOptions.disabled': (
                model: any,
                formState: any,
                field: FormlyFieldConfig
              ) => {
                // access to the main model can be through `this.model` or `formState` or `model
                if (
                  model.ruleType == 'Supplemental Benefit - Paid on CAS Only' ||
                  model.ruleType == 'Supplemental Benefit - Any'
                ) {
                  field.templateOptions.required = true;
                  return false;
                } else {
                  return true;
                }
              }
            },
            hooks: {
              onChanges: (field: FormlyFieldConfig) => {
                // field.templateOptions.options =
                field.form.get('serviceType').valueChanges.subscribe(resP => {
                  if (!field.templateOptions.loading) { field.templateOptions.requiredCheck = true }
                  if (this.model.serviceType != null || field.templateOptions.disabled) { field.templateOptions.requiredCheck = false }
                })
                field.form.get('ruleType').valueChanges.subscribe(res => {
                  field.templateOptions.loading = true;
                  if (
                    this.model.ruleType ==
                    'Supplemental Benefit - Paid on CAS Only' ||
                    this.model.ruleType == 'Supplemental Benefit - Any'
                  ) {
                    field.templateOptions.requiredCheck = true
                    field.templateOptions.disabled = false
                    field.templateOptions.label = "Service Type *"
                    this.s1 = this.service.serviceTypeData(this.model.ruleType, this.model.lineOfBusiness)

                    this.s1.subscribe(report => {
                      this.p1 = report as AddBBIOverrideService[];
                      field.templateOptions.loading = false;
                      // this.p1 = this.p1.map(i => i.ServiceName)
                      //this.p1.sort((a, b) => 0 - (a > b ? -1 : 1));

                      //console.log(this.p1.length)
                      if (this.p1.length == 0) {
                        //alert("Service Type Data is not Available!")
                        //console.log("INSIDE IF")
                        this.p1 = []
                        field.templateOptions.loading = false;
                        field.templateOptions.search$ = term => {
                          if (!term || term === '') {
                            return observableOf(this.p1);
                          }
                          return observableOf(
                            this.p1
                              .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                          );
                        };
                        //this.alertMessage()
                      } else {
                        field.templateOptions.loading = false;
                        field.templateOptions.search$ = term => {

                          if (!term || term === '') {
                            return observableOf(this.p1);
                          }
                          return observableOf(
                            this.p1
                              .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                          );
                        };
                      }

                    });
                  } else {
                    field.templateOptions.loading = false;
                    field.templateOptions.disabled = true;
                  }
                  field.form.get('serviceType').valueChanges.subscribe(resP => {
                    if (this.model.tbi1 != null && this.model.tbi1 != undefined)
                      this.form.get('tbi1').reset();
                    
                      if(this.model.serviceType && this.model.ruleType){
                        let payload = {
                          ruleType:this.model.ruleType,
                          serviceType:this.model.serviceType
                        }
                        this.service.maximumBenefitPeriodicity(payload).subscribe(data =>{
                          maximumBenefitPeriodicityValues = data;
                        })
                      }
                      
                      if(this.model.msbCode != null && this.model.msbCode != undefined)
                      this.form.get('msbCode').reset();
                  });
                });
              },
            },

          }
        ]
      },
      {
        className: 'col-md-12',
        type: 'typeaheadcas',
        key: 'msbCode',
        templateOptions: {
          label: 'MSB Code',
          required: false,
          loading: false,
          placeholder: 'MSb Code',
          search$: term1 => {
            if (!term1 || term1 === '') {
              return observableOf(this.msbCode);
            }
            return observableOf(
              this.t1
                .filter(v => v.toLowerCase().indexOf(term1.toLowerCase()) > -1)
            );
          },
          attributes: {
            style: 'height: 50px; '
          }
        },
        
        expressionProperties: {
          'templateOptions.disabled': (model: any,field: FormlyFieldConfig) => {
            // access to the main model can be through `this.model` or `formState` or `model
            if (model.ruleType == 'Supplemental Benefit - Paid on CAS Only' || model.ruleType == 'Supplemental Benefit - Any') {
              field.templateOptions.required = false;
              return false;
            } else {
              return true;
            }
          }
        },
        hooks: {
          onChanges: (field: FormlyFieldConfig) => {

            field.form.get('serviceType').valueChanges.subscribe(res => {
              this.msbCode = [];
              if (this.model.ruleType === 'Supplemental Benefit - Paid on CAS' || this.model.ruleType === 'Supplemental Benefit - Any') 
              {
                  field.templateOptions.loading = true; 
                  field.templateOptions.disabled = false;
                  this.s1 = this.service.msbCodeData(this.model.ruleType, this.model.lineOfBusiness, this.model.planOption,this.model.serviceType);
               
                this.s1.subscribe(report => {
                  this.msbCode = report as AddBBIOverrideService[];
                  field.templateOptions.loading = false;
                  
                  field.templateOptions.search$ = term => {
                    if (!term || term === '') {
                      return observableOf(this.msbCode);
                    }
                    return observableOf(
                      this.msbCode.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                    );
                  };
                });
              } else if (this.model.ruleType == null || this.model.ruleType == undefined)
              {
                this.msbCode = [];
              }
            });

            field.form.get('ruleType').valueChanges.subscribe(res =>{
              if(this.model.ruleType == 'Supplemental Benefit - Paid on CAS Only' || this.model.ruleType == 'Supplemental Benefit - Any'){
                field.templateOptions.disabled = false
              }else{
                field.templateOptions.disabled = true
              }
            })
          }
        }
      },
      {
        className: 'col-md-12',
        type: 'typeaheadcas',
        key: 'tbi1',
        templateOptions: {
          label: 'TBI',
          required: false,
          loading: false,
          placeholder: 'TBI 1',
          search$: term1 => {
            if (!term1 || term1 === '') {
              return observableOf(this.t1);
            }
            return observableOf(
              this.t1
                .filter(v => v.toLowerCase().indexOf(term1.toLowerCase()) > -1)
            );
          },
          //required: true,
          attributes: {
            style: 'height: 50px; '
          }
        },
        // validation: {
        //   messages: {
        //     required: '⚠️ TBI is required field'
        //   }
        // },
        expressionProperties: {
          'templateOptions.disabled': (model: any, formState: any, field: FormlyFieldConfig) => {
            // access to the main model can be through `this.model` or `formState` or `model
            if (
              model.ruleType == 'Supplemental Benefit - Paid on CAS Only' ||
              model.ruleType == 'Supplemental Benefit - Any' ||
              model.ruleType == 'Ancillary' ||
              model.ruleType == 'Benefit Report'
            ) {
              field.templateOptions.label = "TBI 1 *"
              field.templateOptions.required = true;
              return false;
            } else {
              return true;
            }
          }
        },

        hooks: {
          onChanges: (field: FormlyFieldConfig) => {
            

            field.form.get('serviceType').valueChanges.subscribe(res => {
              if (this.model.serviceType != null && this.model.serviceType != undefined) { 
                  field.templateOptions.loading = true; 
                  field.templateOptions.disabled = false;
                }

              this.s1 = [];
              this.t1 = [];
              if (
                this.model.ruleType ===
                'Supplemental Benefit - Paid on CAS Only' ||
                (this.model.ruleType === 'Supplemental Benefit - Any' &&
                  this.model.serviceType != null &&
                  this.model.serviceType != undefined)
              ) {
                field.templateOptions.label = "TBI 1 *"
                field.templateOptions.requiredCheck = true;
                field.templateOptions.required = true;
                field.templateOptions.disabled = false;
                this.s1 = this.service.TBIData(
                  this.model.ruleType,
                  this.model.lineOfBusiness,
                  this.model.serviceType
                );
               
                this.s1.subscribe(report => {
                  this.t1 = report as AddBBIOverrideService[];
                  field.templateOptions.loading = false;
                 
                  field.templateOptions.search$ = term => {
                    if (!term || term === '') {
                      return observableOf(this.t1);
                    }
                    return observableOf(
                      this.t1
                        .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                    );
                  };
                });
              } else if (
                this.model.serviceType == null ||
                this.model.serviceType == undefined || this.model.serviceType !== null || this.model.serviceType !== undefined
              ) {
                //field.templateOptions.loading = false;
                this.s1 = [];
                this.t1 = [];
              }
              //}
            });

            field.form.get('ruleType').valueChanges.subscribe(res => {
              field.templateOptions.requiredCheck = false;
              field.templateOptions.loading = true;

              if (
                this.model.ruleType === 'Ancillary' ||
                this.model.ruleType === 'Benefit Report'
              ) {
                field.templateOptions.requiredCheck = true; //DF-17252
                field.templateOptions.disabled = false;
                this.s1 = this.playbookService.TBIData(
                  this.model.ruleType,
                  this.model.lineOfBusiness,
                  null
                );
                this.s1.subscribe(report => {
                  this.t1 = report as AddBBIOverrideService[];
                  field.templateOptions.loading = false;

                  field.templateOptions.search$ = term => {
                    if (!term || term === '') {
                      return observableOf(this.t1);
                    }
                    return observableOf(
                      this.t1
                        .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                    );
                  };
                });
              }
              else if (
                this.model.ruleType === null ||
                this.model.ruleType === undefined || this.model.ruleType === '100%' || this.model.ruleType === 'Not Covered'
                || this.model.ruleType === 'Ancillary' ||
                this.model.ruleType === 'Benefit Report' 
              ) {
                field.templateOptions.loading = false;
                field.templateOptions.required = false;
                field.templateOptions.requiredCheck = false;
                
                this.s1 = [];
                this.t1 = [];
                if(this.model.ruleType === '100%' || this.model.ruleType === 'Not Covered'){
                  field.templateOptions.disabled = true;
                }
              }else if (this.model.ruleType === 'BBI Override Only') {
                field.templateOptions.loading = false;
                field.templateOptions.required = false;
                field.templateOptions.requiredCheck = false;
                field.templateOptions.disabled = true;
                
              }
            });
            //field.templateOptions.requiredCheck = false;
            field.form.get('lineOfBusiness').valueChanges.subscribe(resP => {
              //setTimeout(() => { field.templateOptions.requiredCheck = false; }, 10);
              this.s1 = [];
              this.t1 = [];
              field.templateOptions.requiredCheck = false;
              field.templateOptions.loading = true;

              if (
                this.model.ruleType === 'Ancillary' ||
                this.model.ruleType === 'Benefit Report'
              ) {
                field.templateOptions.requiredCheck = false;
                this.s1 = this.playbookService.TBIData(
                  this.model.ruleType,
                  this.model.lineOfBusiness,
                  null
                );

                this.s1.subscribe(report => {
                  this.t1 = report as AddBBIOverrideService[];
                  field.templateOptions.loading = false;

                  field.templateOptions.search$ = term => {
                    if (!term || term === '') {
                      return observableOf(this.t1);
                    }
                    return observableOf(
                      this.t1
                        .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                    );
                  };
                });
              }
              else if (
                this.model.lineOfBusiness === null ||
                this.model.lineOfBusiness === undefined ||
                this.model.lineOfBusiness === 'Group' ||
                this.model.lineOfBusiness === 'Individual'
              ) {

                field.templateOptions.loading = false;
                field.templateOptions.required = false;
                field.templateOptions.requiredCheck = false;
                //this.form.get('tbi1').reset();
                this.s1 = [];
                this.t1 = [];

              }
            });

                field.form.get('tbi1').valueChanges.subscribe(resP => {
                  if (!field.templateOptions.loading) { field.templateOptions.requiredCheck = true }
                  if (this.model.tbi1 != null || field.templateOptions.disabled) { field.templateOptions.requiredCheck = false }
                  if (
                    this.model.ruleType === 'Ancillary' ||
                    this.model.ruleType === 'Benefit Report'
                  ) {
                    field.templateOptions.label = "TBI 1 *"
                    if (this.model.tbi1 === null || this.model.tbi1 === undefined) {
                      field.templateOptions.required = true;
                     //field.templateOptions.requiredCheck = true;
                    }
                    if (this.model.tbi1 != null) {
                      field.templateOptions.requiredCheck = false;
                    }

                  }
                  else if (
                    (
                      this.model.ruleType ===
                      'Supplemental Benefit - Paid on CAS Only' &&
                      this.model.serviceType != null &&
                      this.model.serviceType != undefined) ||
                    (this.model.ruleType === 'Supplemental Benefit - Any' &&
                      this.model.serviceType != null &&
                      this.model.serviceType != undefined)
                  ) {
                    field.templateOptions.label = "TBI 1 *"
                    if (!field.templateOptions.loading) {
                      field.templateOptions.required = true;
                      field.templateOptions.requiredCheck = true;
                    }
                    if (this.model.tbi1 === null || this.model.tbi1 === undefined) {

                      field.templateOptions.required = true;
                      field.templateOptions.requiredCheck = true;
                    }
                    if (this.model.tbi1 != null) {
                      field.templateOptions.requiredCheck = false;
                    }

                  } else {
                    field.templateOptions.label = "TBI 1"
                    field.templateOptions.required = false;
                    field.templateOptions.requiredCheck = false;
                  }
                  if (field.templateOptions.disabled) {
                    field.templateOptions.requiredCheck = false
                    field.templateOptions.label = "TBI 1"

                  }
                });
          }
        }
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-3',
            type: 'typeaheadcas',
            key: 'costShareType',
            templateOptions: {
              label: 'Cost Share Type',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(costShareTypeValues);
                }

                return observableOf(
                  costShareTypeValues
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Cost Share Type',
              required: false
            },
            hooks: {
              onChanges: field => {
                field.form.get('costShareType').valueChanges.subscribe(resP => {
                  if (
                    this.model.costShareAmount != null &&
                    this.model.costShareAmount != undefined
                  )
                    this.form.get('costShareAmount').reset();
                });
              }
            }
          },
          {
            className: 'col-md-3',
            type: 'textarea',
            key: 'costShareAmount',
            templateOptions: {
              label: 'Cost Share Amount',
              placeholder: 'Enter Amount',
              required: true,
              type: 'number'
              // min: 1,
              // max: 100
            },
            validation: {
              messages: {
                required: '⚠️ Cost Share Amount is required field'
              }
            },
            expressionProperties: {
              'templateOptions.disabled': '!model.costShareType'
            },
            validators: {
              validNumber: {
                expression: c => {
                 
                  if (c.value && this.model.costShareType === 'copayment') {
                    //return /^[0-9]+(\.?[0-9]+)?$/.test(c.value);
                    return /^[0-9]*\.[0-9]{2}$/g.test(c.value);
                   
                  } else if (
                    c.value &&
                    this.model.costShareType === 'coinsurance'
                  ) {
                    //return /^(0|[1-9][0-9]*)$/.test(c.value);
                    return /^[1-9][0-9]?$|^100$/.test(c.value);
                  }
                },
                message: (error, field: FormlyFieldConfig) => {
                  if (this.model.costShareType === 'coinsurance') {
                    //return `⚠️ Numbers without decimals are allowed`;
                    return `⚠️ Enter numeric values from 1 to 100 without decimal`;
                  } else if (this.model.costShareType === 'copayment') {
                    return `⚠️ Enter numeric values up to two decimal places`;
                  }
                }
              }
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {
                field.form.get('costShareType').valueChanges.subscribe(resP => {
                  if (
                    this.model.costShareType != null &&
                    this.model.costShareType != undefined
                  )
                    {
                      field.templateOptions.disabled = false;
                    }
                });
              }
            }
            
          },
          {
            className: 'col-md-3',
            type: 'typeaheadcas',
            key: 'costSharePeriodicity',
            templateOptions: {
              label: 'Cost Share Periodicity',
              loading: false,
              
              search$: term => {
                if (!term || term === '') {
                  return observableOf(
                    costSharePeriodicityValues.sort(
                      (a, b) => 0 - (a > b ? -1 : 1)
                    )
                  );
                }
                return observableOf(
                  costSharePeriodicityValues
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Cost Share Periodicity',
              required: false
            }
            
          },
          {
            className: 'col-md-3',
            type: 'textarea',
            key: 'serviceOopMaxAmount',
            templateOptions: {
              label: 'Service OOP Maximum Amount',
              placeholder: 'Enter Amount',
              required: false,
              type: 'number',
              attributes: {
                width: '100%'
              }
            },
            validators: {
              validNumber: {
                expression: c =>
                  ///^\s*-?\d+(\.\d{1,2})?\s*$/.test(c.value) 
                  /^[0-9]*\.[0-9]{2}$/g.test(c.value) || !c.value,
                message: (error, field: FormlyFieldConfig) =>
                  `⚠️ Enter numeric values up to two decimal places`
              }
            },
            hooks: {
              onChanges: field => {
                field.form
                  .get('serviceOopMaxAmount')
                  .valueChanges.subscribe(resP => {
                    if (
                      this.model.serviceOopMaximumPeriodicity != null &&
                      this.model.serviceOopMaximumPeriodicity != undefined
                    )
                      this.form.get('serviceOopMaximumPeriodicity').reset();
                  });
              }
            }
          }
        ]
      },
      {
        template: '&nbsp'
        // template: '<hr /><div><strong>Address:</strong></div>',
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-4',
            type: 'typeaheadcas',
            key: 'serviceOopMaximumPeriodicity',
            templateOptions: {
              label: 'Service OOP Maximum Periodicity',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(
                    serviceOopMaximumPeriodicityValues.sort(
                      (a, b) => 0 - (a > b ? -1 : 1)
                    )
                  );
                }
                return observableOf(
                  serviceOopMaximumPeriodicityValues
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Service OOP Maximum Periodicity',
              required: false
            },
            expressionProperties: {
              'templateOptions.disabled': (model) => !model.serviceOopMaxAmount
            },

            hooks:{
              onInit: (field: FormlyFieldConfig) => {
                field.form.get('serviceOopMaxAmount').valueChanges.subscribe(resp => {
                  if(field.form.get('serviceOopMaxAmount').value != ''){
                    field.templateOptions.disabled = false
                  }
                })
              }
            }
          },
          {
            className: 'col-md-4',
            type: 'textarea',
            key: 'maxBenefitAmount',
            templateOptions: {
              label: 'Maximum Benefit Amount',
              placeholder: 'Enter Maximum Benefit Amount',
              required: false,
              type: 'number',  
              attributes: {
                width: '100%'
              }
            },
            validators: {
              validNumber: {
                expression: c =>
                  ///^\s*-?\d+(\.\d{1,2})?\s*$/.test(c.value) 
                  /^[0-9]*\.[0-9]{2}$/g.test(c.value) || !c.value,
                message: error =>
                  `⚠️ Enter numeric values up to two decimal places`
              }
            },
            hooks: {
              onChanges: field => {
                field.form
                  .get('maxBenefitAmount')
                  .valueChanges.subscribe(resP => {
                    if (
                      this.model.maxBenefitPeriodicity != null &&
                      this.model.maxBenefitPeriodicity != undefined
                    )
                      this.form.get('maxBenefitPeriodicity').reset();
                  });
              }
            }
          },
          {
            className: 'col-md-4',
            type: 'typeaheadcas',
            key: 'maxBenefitPeriodicity',
            templateOptions: {
              label: 'Maximum Benefit Periodicity',
              
              search$: term => {
                if (!term || term === '') {
                  return observableOf(maximumBenefitPeriodicityValues);
                }
                return observableOf(
                  maximumBenefitPeriodicityValues
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Maximum Benefit Periodicity',
              required: false
            },
            expressionProperties: {
              'templateOptions.disabled': '!model.maxBenefitAmount'
            },

            hooks:{
              onInit: (field:FormlyFieldConfig) => {
                field.form.get('maxBenefitAmount').valueChanges.subscribe(resp => {
                  if(field.form.get('maxBenefitAmount').value != ''){
                    field.templateOptions.disabled = false
                    if(this.model.serviceType == null && this.model.ruleType){
                      let payload = {
                        ruleType:this.model.ruleType,
                        serviceType:""
                      }
                      this.service.maximumBenefitPeriodicity(payload).subscribe(data =>{
                        maximumBenefitPeriodicityValues = data;
                      })
                    }
                  }
                })
              }
            }
          }
        ]
      },
      {
        template: '&nbsp'
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-3',
            type: 'textarea',
            key: 'limitValue',
            templateOptions: {
              label: 'Limit Value',
              placeholder: 'Enter Limit Value',
              required: false,
              type: 'number',
              //step: 0,
              //min: 0,
              attributes: {
                width: '100%'
              }
            },
            validators: {
              validNumber: {
                expression: c => /^(0|[1-9][0-9]*)$/.test(c.value) || !c.value,
                message: (error, field: FormlyFieldConfig) =>
                  `⚠️ Enter numeric values without decimal`
              }
            },
            hooks: {
              onChanges: field => {
                field.form.get('limitValue').valueChanges.subscribe(resP => {
                  if (
                    this.model.limitDescription != null &&
                    this.model.limitDescription != undefined
                  )
                    this.form.get('limitDescription').reset();
                  if (
                    this.model.limitPeriodicity != null &&
                    this.model.limitPeriodicity != undefined
                  )
                    this.form.get('limitPeriodicity').reset();
                });
              }
            }
          },
          {
            className: 'col-md-6',
            type: 'typeaheadcas',
            key: 'limitDescription',
            templateOptions: {
              label: 'Limit Description',
              
              search$: term => {
                if (!term || term === '') {
                  return observableOf(
                    limitDescriptionValues?.sort((a, b) => 0 - (a > b ? -1 : 1))
                  );
                }
                return observableOf(
                  limitDescriptionValues.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Description',
              required: false
            },
            expressionProperties: {
              'templateOptions.disabled': '!model.limitValue'
            },

            hooks: {
              onInit: (field: FormlyFieldConfig) => {
                field.form.get('limitValue').valueChanges.subscribe(resp => {
                  if(field.form.get('limitValue').value != ''){
                    field.templateOptions.disabled = false
                  }
                })
              }
            }
          },
          {
            className: 'col-md-3',
            type: 'typeaheadcas',
            key: 'limitPeriodicity',
            templateOptions: {
              label: 'Limit Periodicity',
              
              search$: term => {
                if (!term || term === '') {
                  return observableOf(limitPeriodicityValues);
                }
                return observableOf(
                  limitPeriodicityValues
                    .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                );
              },
              placeholder: 'Select Limit Periodicity',
              required: false
            },
            expressionProperties: {
              'templateOptions.disabled': '!model.limitValue'
            },
            hooks:{
              onInit: (field:FormlyFieldConfig) => {
                field.form.get('limitValue').valueChanges.subscribe(resp => {
                  if(field.form.get('limitValue').value != ''){
                    field.templateOptions.disabled = false
                  }
                })
              }
            }
          }
        ]
      },
      {
        template: '&nbsp'
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-3'
          },
          {
            className: 'col-md-6',
            type: 'textarea',
            key: 'note',
            templateOptions: {
              label: 'Note',
              placeholder: 'Note',
              required: false,
              rows: 3,
              attributes: {
                width: '100%'
              },
              maxLength: 250
            }
          },
          {
            className: 'col-md-3'
          },
      ]
     },
     {
        fieldGroupClassName: 'row',
        fieldGroup: [         
         {
            className: 'col-md-6',
            type: 'typeaheadcas',
            key: 'deductible',
            templateOptions: {
              label: 'Deductible',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.tbiData);
                }

                return observableOf(
                  this.tbiData
                    .filter(
                      v => v.toLowerCase().indexOf(term.toLowerCase()) > -1
                    )
                    
                );
              },
              placeholder: 'Select Deductible',
              required: false,
              attributes: {
                style: 'height: 50px; '
              }
            }
          },
          {
            className: 'col-md-6',
            type: 'typeaheadcas',
            key: 'oop',
            templateOptions: {
              label: 'OOP',
              search$: term => {
                if (!term || term === '') {
                  return observableOf(this.tbiData);
                }

                return observableOf(
                  this.tbiData
                    .filter(
                      v => v.toLowerCase().indexOf(term.toLowerCase()) > -1
                    )
                    
                );
              },
              placeholder: 'Select OOP',
              required: false,
              attributes: {
                style: 'height: 50px; '
              }
            }
          }
        ]
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-3',
            type: 'datepicker-custom',
            key: 'effectiveDate',
            defaultValue: new Date(cYear, 0, 1),
            templateOptions: {
              label: 'Effective Date',
              placeholder: 'Enter Date',
              required: true,
              readonly: true,
              datepickerOptions: {
                //min: this.requiredDate,
                max: '2099-12-31',
              }
            },
            validation: {
              messages: {
                required: '⚠️ Effective Date is required field'
              }
            }
          },
          
          {
            className: 'col-md-3',
            type: 'input',
            key: 'termDate',
            defaultValue: "12/31/2099",
            templateOptions: {
              label: 'Term Date',
              //  placeholder: 'Enter Date',
              required: false,
              readonly: true
            }
          },
          {
            className: 'col-md-6',
            type: 'textarea',
            key: 'comments',
            templateOptions: {
              label: 'Override Reason',
              placeholder: 'Override Reason',
              required: true,
              rows: 3,
              attributes: {
                width: '100%'
              },
              maxLength: 250
            },
            validation: {
              messages: {
                required: '⚠️ Override Reason is required field'
              }
            }
          }
        ]
      },
      {
        template: '&nbsp'
      }
    ];
  }
  submit() {
    //alert();
    JSON.stringify(this.model);
  }
  resetAlert() {
    //alert();
  }


  //paul
  isDisable() {
    return !this.form.valid
   
  }

  check1 = false;
  resetForm() {
    //this.model = {}
    this.check1 = true;
    this.options.resetModel();
    this.form.get('planOption').reset();
    this.form.get('lineOfBusiness').reset();

    setTimeout(() => { this.check1 = false; }, 3000);
  }

  cancelAlert() {
    //alert();
  }

  planYear_data: any = [];
  public planYearData() {

    const currentYearPlus1 = moment().year() + 1;
    const currentYearPlus1Minus6 = currentYearPlus1 - 6;
    this.planYear_data = range(currentYearPlus1, currentYearPlus1Minus6, -1)

  }
 

}
