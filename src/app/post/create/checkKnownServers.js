var Excel = require('exceljs');
var servers=['louweblts78',
'louweblts80',
'simapplts960',
'simapplts961',
'simapplts962',
'simapplts963',
'simapplts964',
'simapplts965',
'simapplts966','louapplPL33S01','LOUAPPLPL33S02'];
//checkServerInList(servers);
function checkServerInList(servers,callback){
    var workbook = new Excel.Workbook();
    var fileName ="HPAS Environments";
    workbook.xlsx.readFile('\\\\LOUAPPWDS183\\HPASFiles\\Servers\\' + fileName + '.xlsx')
    .then(function () {
        var worksheet = workbook.getWorksheet(1);

       // var obj = readExcelToObjetArray(worksheet);
        var promiseArr=[];
        var excelObj=[];
       var excelReadPromise=new Promise(function(resolve,reject){
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
     //   var serverNameExcel = row.getCell(2).value;
     promiseArr.push[
         new Promise((resolve,reject)=>{
            var dataObj={};
            dataObj['serverName']=row.getCell(2).value;
            dataObj['environment']=row.getCell(1).value;
            dataObj['technology']=row.getCell(3).value;
            dataObj['osVersion']=row.getCell(4).value;
            dataObj['softwareVersion']=row.getCell(5).value;
            dataObj['sharedServer']=row.getCell(6).value;
            dataObj['comments']=row.getCell(7).value;
            dataObj['valuesExist']="true";
            excelObj.push(dataObj);
            resolve();
         })
        ]
       
      });
      Promise.all(promiseArr).then(()=>{
        resolve()
      });
    });

    excelReadPromise.then(()=>{
        var promiseArrServer=[];
        var dataArr=[];
        var dataArrNotFound=[];
        servers.forEach((serverName)=>{
            // count++;
             if(serverName!=null && serverName!="" && serverName !=undefined){
                 promiseArrServer.push(
                 checkIndividualServerNew(serverName,excelObj).then((data)=>{
                     if(data['valuesExist']=="false"){
                        dataArrNotFound.push(data);
                     }else {
                        dataArr.push(data);
                     }
             })
         );  
         }
         });
         Promise.all(promiseArrServer).then(() => {
            
            var finalArrObj=dataArr.concat(dataArrNotFound);
               callback(finalArrObj);
           }).catch((error)=>{
               callback(undefined, error);
           });
    })
    });
}
function checkServerInListOld(fileName,servers,callback){
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile('\\\\LOUAPPWDS183\\HPASFiles\\Servers\\' + fileName + '.xlsx')
        .then(function () {
            var worksheet = workbook.getWorksheet(1);
            var row = worksheet.getRow(1);
            var promiseArr=[];
            var dataArr=[];
           
            servers.forEach((serverName)=>{
           // count++;
            if(serverName!=null && serverName!="" && serverName !=undefined){
                promiseArr.push(
                checkIndividualServer(serverName,worksheet).then((data)=>{
                dataArr.push(data);
            })
        );  
        }
        });
        Promise.all(promiseArr).then(() => {
         //   console.log(dataArr);
            callback(dataArr);
        }).catch((error)=>{
            callback(undefined, error);
        });
        })
        .catch((error) => {
            console.error('error occured is ', error);
            callback(undefined, error);
        });
}
function readExcelToObjetArray(worksheet){
    var promiseArr=[];
    var excelObj=[];
    return new Promise(function(resolve,reject){
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
     //   var serverNameExcel = row.getCell(2).value;
     promiseArr.push[
         new Promise((resolve,reject)=>{
            dataObj['serverName']=row.getCell(2).value;
            dataObj['environment']=row.getCell(1).value;
            dataObj['technology']=row.getCell(3).value;
            dataObj['osVersion']=row.getCell(4).value;
            dataObj['softwareVersion']=row.getCell(5).value;
            dataObj['sharedServer']=row.getCell(6).value;
            dataObj['comments']=row.getCell(7).value;
            excelObj.push(dataObj);
            resolve();
         })
        ]
       
      });
      Promise.all(promiseArr).then(()=>{
        resolve(excelObj)
      });
    });
}
function checkIndividualServerNew(serverName,excelObj){
    return new Promise(function(resolve,reject){
       // console.log('excelObj.lengt ',excelObj.length);
        for (var i = 0; i < excelObj.length; i++) {

         //   console.log('i is ',i);
        var obj=excelObj[i];
        if(obj.serverName!=null && obj.serverName!="" && obj.serverName.trim().toUpperCase()==serverName.trim().split('.')[0].toUpperCase()){
            resolve(obj);
            break;
        }
        else{
            if(i==excelObj.length-1){
                var objNew={};
                objNew['serverName']=serverName;
                objNew['environment']="";
                objNew['technology']="";
                objNew['osVersion']="";
                objNew['softwareVersion']="";
                objNew['sharedServer']="";
                objNew['comments']="";
                objNew['valuesExist']="false";
                resolve(objNew);
            }
        }
        }
       
    });
}
function checkIndividualServer(serverName,worksheet){
return new Promise(function(resolve,reject){
    var dataObj={};
    var rowCount=worksheet.actualRowCount;
   // console.log('actual rowCount',rowCount);
  //  console.log('rowCount',worksheet.rowCount);
  var PromiseArray=[];
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        var serverNameExcel = row.getCell(2).value;
        console.log('serverNameExcel ',serverNameExcel);
        console.log('serverName ',serverName);
        //var serverNameTrimmed=serverName.split('.')[0];
       // console.log('serverNameTrimmed ',serverNameTrimmed);
       //console.log(serverNameExcel.toString().toUpperCase()===serverName.toString().toUpperCase());
     //  PromiseArray.push[
    //    new Promise((resolve,reject)=>{
        if(serverNameExcel!=null && serverNameExcel!="" && serverNameExcel.toString().toUpperCase()===serverName.split('.')[0].toString().toUpperCase()){
                 
            dataObj['serverName']=serverName;
            dataObj['environment']=row.getCell(1).value;
            dataObj['technology']=row.getCell(3).value;
            dataObj['osVersion']=row.getCell(4).value;
            dataObj['softwareVersion']=row.getCell(5).value;
            dataObj['sharedServer']=row.getCell(6).value;
            dataObj['comments']=row.getCell(7).value;
            resolve(dataObj);
           return;
        }
        else {
            if(rowCount==rowNumber){
                dataObj['serverName']=serverName;
                dataObj['environment']="";
                dataObj['technology']="";
                dataObj['osVersion']="";
                dataObj['softwareVersion']="";
                dataObj['comments']="";
                resolve(dataObj);
            }
        }
    //   })
             
              
        //  }
          
      });
});
}

module.exports.checkServerInList=checkServerInList;