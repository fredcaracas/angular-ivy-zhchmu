import { Component, OnInit, OnDestroy,ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { SubNetworkService } from '../subNetwork.service';
import { EditSubNetworkNameComponent } from './edit/editSubNames.component';
import { AddSubNetworkNameComponent } from './add/addSubNames.component'
import { SharedService } from 'src/app/services/sharedServices/play-book-service/shared.service';
import { ClrDatagrid, ClrDatagridColumn, ClrDatagridFilterInterface  } from '@clr/angular';
import { RecordSaveComponent } from 'src/app/components/popup-dialog-alert-box/record-save/record-save.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Users } from '../subNames/Users';

export class LobFilter implements ClrDatagridFilterInterface<Users> {
  public selectedColors: string[] = [];

  public changes = new Subject<any>();

  public isActive(): boolean {
    return this.selectedColors.length > 0;
  }

  public accepts(user: Users): boolean {
    return this.selectedColors.indexOf(user.name.toLocaleLowerCase()) > -1;
  }
}

@Component({
  selector: 'app-subNames',
  templateUrl: './subNames.component.html',
  styleUrls: ['./subNames.component.css']
})
export class SubNamesComponent implements OnInit {
  @ViewChild('dg', { static: true }) datagrid: ClrDatagrid;
  constructor(
    private service: SubNetworkService,
    private shared:SharedService, private router:Router,
    public dialog: MatDialog,
  ) {
    this.customLOBFilter = new LobFilter();
  }
  ngOnInit(): void {
     this.getSubNames()
  }

  selected;
  users = [];
  dataSource = [];
  loading: boolean = true;

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

  public getSubNames() {

    let resp = this.service.listAllSubNetworkName();
    
    resp.subscribe(report => {
      
      this.dataSource = report as SubNetworkService[];
      console.log("names", this.dataSource)
      let groupedData = this.dataSource.map(props => {
        return {
          name: props
        };
      });
      groupedData.sort();
      this.users = groupedData;
      console.log("names", this.users)
      this.loading = false;

    })

  }
  
  openDialogAddBBI() {
    const dialogRef = this.dialog.open(EditSubNetworkNameComponent, {
      data: this.selected.name,
      width: '60%',
      height: '50%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getSubNames()
    });
  }

  openDialogAddSubName() {
    const dialogRef = this.dialog.open(AddSubNetworkNameComponent, {
      width: '60%',
      height: '50%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getSubNames()
    });

  }
}