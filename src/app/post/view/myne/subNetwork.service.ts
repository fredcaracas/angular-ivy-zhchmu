import { Injectable, Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
@Component({
    template: `
    <p></p>
  `
})

export class SubNetworkService {
    constructor(private http: HttpClient) { }

    public listAllPlanYear() {

        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/planYear'
        return this.http.get(url);
    }

    public listAllPlanID(planYear){
        let url = environment.GROUPGENERATE_URL + `NPDApp/SubNetwork/listAllPlanID?planYear=${planYear}`
        return this.http.get(url);
 
    }

    public listAllPlanOption(planYear){
 
        let url = environment.GROUPGENERATE_URL + `NPDApp/SubNetwork/listAllPlanOption?planYear=${planYear}`
        return this.http.get(url);
    }

    public listAllSubNetworkName(){
 
        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/listAllSubNetworkName'
        return this.http.get(url);

    }

    public getDataForExcelReport(){

        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/getDataForExcelReport'
        return this.http.get(url);
    }

    public getSubnetworks(planYear, policy, plans){

        let body = {};

        if(plans != null || plans != undefined ){

            body = {

                "planYear": planYear,
                "policy": policy,
                "plans": plans
            }
            
        }else{
            body = {

                "planYear": planYear,
                "policy": policy,
                "plans": []
            }
        }


        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/getSubnetworks'
        return this.http.post(url, body)

    }

    public addSubNetwokName(name){

        let body = {
            "SubnetworkName": name
        }

        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/addSubNetwokName'
        return this.http.post(url, body)
    }

    public updateSubNetwokName(oldName, newName){

        let body = {
            "oldName": oldName,
            "newName": newName
        }
        
        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/updateSubNetwokName'
        return this.http.post(url, body)

    }

    public addSubnetwok(data){

        let body = {
            "Policy": data.Policy,
            "PlanYear": data.PlanYear,
            "Plan": data.Plan,
            "SubnetworkName": data.SubnetworkName,
            "NetworkType": data.NetworkType,
            "SubNetwork": data.SubNetwork,
            "EffectiveDate": data.EffectiveDate,
            "TermDate": data.TermDate
        }
        console.log(body)
        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/addSubnetwok'
        return this.http.post(url, body)

    }

    public updateSubnetwok(data){

        let body = {
            "id": data.id,
            "subnetwork": data.Subnetwork,
            "termDate": data.TermDate
        }

        let url = environment.GROUPGENERATE_URL + 'NPDApp/SubNetwork/updateSubNetwork'
        return this.http.post(url, body)

    }



}