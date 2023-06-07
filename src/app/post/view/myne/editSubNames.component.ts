import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyField } from '@ngx-formly/core';
import { of as observableOf } from 'rxjs/observable/of';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddbbipopupComponent } from 'src/app/components//popup-dialog-alert-box/addbbipopup/addbbipopup.component';
import { CancelpopupComponent } from 'src/app/components/popup-dialog-alert-box/cancelpopup/cancelpopup.component';
import { SubNetworkService } from '../../subNetwork.service';
import { RecordCancelComponent } from 'src/app/components//popup-dialog-alert-box/record-cancel/record-cancel.component';
import * as moment from 'moment';
import { RecordSaveComponent } from 'src/app/components/popup-dialog-alert-box/record-save/record-save.component';
import { Router } from '@angular/router';
export interface DialogData {
  Name: string;
  id: string
}


@Component({
  selector: 'app-editSubNetwork',
  templateUrl: './editSubNames.component.html',
  styleUrls: ['./editSubNames.component.css']
})
export class EditSubNetworkNameComponent implements OnInit {
  @Output() messageEvent = new EventEmitter<string>();
  component: FormlyFieldConfig;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog,
    private service: SubNetworkService,
    private router: Router,
    public thisDialogRef: MatDialogRef<EditSubNetworkNameComponent>
  ) {

  }

  ngOnInit(): void {
    this.modelEditGGO()
  }
  onAdd = new EventEmitter();

  onButtonClick() {
    this.onAdd.emit(this.data.Name);
  }
  sendMessage() {
    this.messageEvent.emit(this.data.Name);
  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];

  public modelEditGGO() {
    console.log(this.data)
    this.fields = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-4',
            template: '<p>Sub Network Name:</p>',
          },
          {
            className: 'col-md-6',
            type: 'input',
            key: 'name',
            defaultValue: this.data,
            templateOptions: {

              required: true,
              maxLength: 50,
              rows: 1,
              attributes: {
                width: '200%'
              }
            },

          }
        ]
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
    this.form.get('name').setValue(this.data)

  }

  saveEditedSubName() {

    const arry = this.service.listAllSubNetworkName()
    arry.subscribe(response => {

      const duplicateElements = this.findDuplicates(response, this.model.name);
      console.log(duplicateElements);

      if (duplicateElements.length > 0) {

        let errormessage = "Edited Sub Network already exists."
        this.alertpopup(errormessage);

      } else {

        let resp = this.service.updateSubNetwokName(this.data, this.model.name)

        resp.subscribe(res => {

          const dialogRef = this.dialog.open(RecordSaveComponent, {
            height: '180px',
            width: '600px',
            disableClose: true,
            data: "✔️ Edited Sub Network Name has been saved."
          });

          dialogRef.afterClosed().subscribe(result => {
            this.dialog.closeAll();
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
    })
  }

  findDuplicates = (array, value) => {
    let foundElements = [];
    for (var i: number = 0, len: number = array.length; i < len; i++) {
      if (array[i] === value) {
        foundElements.push(array[i]);
      }
    }
    return foundElements;
  }

}