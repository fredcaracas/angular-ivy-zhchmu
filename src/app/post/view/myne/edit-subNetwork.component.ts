import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { of as observableOf } from 'rxjs/observable/of';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RecordCancelComponent } from 'src/app/components/popup-dialog-alert-box/record-cancel/record-cancel.component';
import { RecordSaveComponent } from 'src/app//components/popup-dialog-alert-box/record-save/record-save.component';
import { Router } from '@angular/router';
import { SubNetworkService } from '../subNetwork.service';

export interface DialogData {

  id: string,
  Policy: string,
  PlanYear: string,
  Plan: string,
  SubnetworkName: string,
  NetworkType: string,
  SubNetwork: string,
  EffectiveDate: string,
  TermDate: string,

}

@Component({
  selector: 'app-editSubNetwork',
  templateUrl: './edit-subNetwork.component.html',
  styleUrls: ['./edit-subNetwork.component.css']
})

export class EditSubNetworkComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog, public service: SubNetworkService,
    private router: Router, public thisDialogRef: MatDialogRef<EditSubNetworkComponent>) { }
  loading = false;
  isLoading = false;


  ngOnInit(): void {

    this.minDate = new Date(new Date(this.data.EffectiveDate));
    this.maxDate = new Date("12/31/2099");
    this.addNewBBIPBM()
  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];
  minDate: Date;
  maxDate: Date;
  startDate = new FormControl(new Date(this.data.EffectiveDate));
  endDate = new FormControl(new Date(this.data.TermDate));

  public addNewBBIPBM() {

    let planID = ""
    let planOption = ""

    if(this.data.Policy === "Group"){
      planOption = this.data.Plan
    }else{
      planID = this.data.Plan
    }

    this.data.Policy
 
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
            defaultValue: this.data.Policy,
            templateOptions: {
              readonly: true,
              disabled: true,
              required: false,
            },
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
            defaultValue: this.data.PlanYear,
            templateOptions: {
              readonly: true,
              disabled: true,
              required: false,
            },
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
            defaultValue: planID,
            templateOptions: {
              readonly: true,
              disabled: true,
              required: false,
            },
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
            defaultValue: planOption,
            templateOptions: {
              readonly: true,
              disabled: true,
              required: false,
            },
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
          defaultValue: this.data.SubnetworkName,
          templateOptions: {
            readonly: true,
              disabled: true,
              required: false,
          },
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
            defaultValue: this.data.NetworkType,
            templateOptions: {
              readonly: true,
              disabled: true,
              required: true,
              
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
            defaultValue: this.data.SubNetwork,
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

  submit() {
    console.warn();
  }

cancelAlert() {
    console.warn();

    const dialogRef = this.dialog.open(RecordCancelComponent, {
      height: '180px',
      width: '600px',
      data: "⚠️ Are you sure you want to Cancel?",
      disableClose: true
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Confirm') {
        this.dialog.closeAll();
      }
    });

  }

  alertpopup(errormessage) {
    const dialogRef = this.dialog.open(RecordSaveComponent, {
      height: '180px',
      width: '600px',
      disableClose: true, data: "⚠️" + errormessage
    });

    dialogRef.afterClosed().subscribe(result => {
      this.dialog.closeAll();

    });

  }

  resetForm() {
    this.options.resetModel(); 
    let subNetwork = this.form.get('subNetwork');
    subNetwork.setValue(this.data.SubNetwork) 
    this.endDate = new FormControl(new Date(this.data.TermDate));
  }

  editSubNetwork(pker2) {

    this.isLoading = true;
    
    let data = {
  
      "id": this.data.id,
      "Subnetwork": this.model.subNetwork,
      "TermDate": pker2
    }

    let resp = this.service.updateSubnetwok(data)

        resp.subscribe(res => {

          const dialogRef = this.dialog.open(RecordSaveComponent, {
            height: '180px',
            width: '600px',
            disableClose: true,
            data: "✔️ Edited Sub Network has been saved."
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