const logger = require('../Main/logger.js');
const config = require('../config/loadConfig.js');
const mongodb = require('../db/mongodb.js');
const oracledb = require('../db/oracledb.js');
var moment = require('moment-timezone');
moment().tz("America/Los_Angeles").format();
const mongoose = require('mongoose')

const eventsSchema = new mongoose.Schema(
    {
        ProductEvent: 'Mixed'
    }
)

var generateMiMgEvents = async (envName, dateF, dateT, isErrorOnly, callback) => {
  config.loadConfig(envName, (gConfig, err) => {
    if (gConfig) {
      oracledb.connect(gConfig, true, async (oracleConn, err) => {
        mongodb.connect(gConfig, async (db, err) => {
        if(oracleConn) {
         
const miModel = mongoose.model('mi_events', eventsSchema)
          var dateFrom = moment(dateF);
          var dateTo = moment(dateT)
          
          var dateFromNewFormat = dateFrom.format('DD-MM-YYYY HH:mm:ss');
          var dateToNewFormat = dateTo.format('DD-MM-YYYY HH:mm:ss');
          await oracleConn.execute(
          `ALTER SESSION SET TIME_ZONE='America/New_York'`,
          [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
          
          const events = await oracleConn.execute(
            `select * from PRODUCT_CACHE_TRANS_LOG 
            where 
                TIME_CACHED >= to_timestamp('`+dateFromNewFormat+`', 'dd-mm-yyyy hh24:mi:ss') and 
                TIME_CACHED <= to_timestamp('`+dateToNewFormat+`', 'dd-mm-yyyy hh24:mi:ss') and  PLAN_ID not in ('H0028-007-909-2025','H0028-007-908-2025','H2237-007-000-2025','H2237-001-000-2025','H2237-007-000-2024','H2237-001-000-2024','H0028-025-002-2025','H0028-019-000-2025') and
                ((SERVICE_NAME in ('MIDeletePlanRequest')) or (SERVICE_NAME in ('TransformAPPEntityMI') and PLAN_STATUS NOT in ('Dummy'))  or
                (SERVICE_NAME in ('MGDeletePlanRequest', 'PSHSynchMGPharmacy', 'PSHSynchMGMedical') and PLAN_STATUS in ('Active', 'Inactive', 'Sold')))`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            console.log(`select * from PRODUCT_CACHE_TRANS_LOG 
            where 
                TIME_CACHED >= to_timestamp('`+dateFromNewFormat+`', 'dd-mm-yyyy hh24:mi:ss') and 
                TIME_CACHED <= to_timestamp('`+dateToNewFormat+`', 'dd-mm-yyyy hh24:mi:ss') and  PLAN_ID not in ('H0028-007-909-2025',
'H0028-007-908-2025',
'H2237-007-000-2025',
'H2237-001-000-2025',
'H2237-007-000-2024',
'H2237-001-000-2024',
'H0028-025-002-2025',
'H0028-019-000-2025') and
                ((SERVICE_NAME in ('TransformAPPEntityMI', 'MIDeletePlanRequest') and PLAN_STATUS NOT in ('Dummy')) or 
                (SERVICE_NAME in ('MGDeletePlanRequest', 'PSHSynchMGPharmacy', 'PSHSynchMGMedical') and PLAN_STATUS in ('Active', 'Inactive', 'Sold')))`);
            console.log("output length: " + events.rows.length)
          if(events.rows.length > 0) {

            var MGplans = [];
            var MIplans = [];
            var transactionIDs = [];
            //var c = 0;
            await events.rows.forEach(async function  (event, index) {
              //console.log(c+"======")
             // c = c + 1;
              
              var planID = event.PLAN_ID;
              if(planID === null) {
                /*planID = event.YEAR + "-" + event.PLAN_NUMBER + "-" + event.PLAN_OPTION + "-" 
                + event.RX_NUMBER + "-"  + event.PDP_NUMBER+ "-";*/
                planID = `${event.YEAR}-${event.PLAN_NUMBER}-${event.PLAN_OPTION}-${event.RX_NUMBER}-${event.PDP_NUMBER}-`;
                
                if(!MGplans.includes(planID)) {
                MGplans.push(planID)
                }
              } else {
                if(!MIplans.includes(planID)) {
                MIplans.push(planID)
                }
              }
              if(!transactionIDs.includes(event.TRANSACTIONID)) {
                transactionIDs.push(event.TRANSACTIONID)
              }
            });
           //TODO try this!! planID = null;
           /* console.log(MIplans)
            console.log(MGplans)*/
            var MGresult = await db.collection('mg_products').find({ "_PlanIdentifier": { "$in": MGplans }}).toArray();
          //console.log("mongodb 1")
            var MIresult = await db.collection('mi_products').find({ "_PlanIdentifier": { "$in": MIplans }}).toArray();
           // console.log("mongodb 2")
             //let miEventsPSH = await db.collection('mi_events').find({ "ProductEvent.EventIdentifier": { "$in": MIplans }}).toArray();
             //let miEventsPSH = await db.collection('mi_events').find().toArray();
             let miEventsPSH = await sampleEventsMI({}, transactionIDs, MIplans, dateFrom, dateTo, db, miModel);
            // console.log("mongodb 3")
             //let mgEventsPSH = await db.collection('mg_events').find({ "ProductEvent.EventIdentifier": { "$in": MGplans }}).toArray();
             //let mgEventsPSH = await db.collection('mg_events').find().toArray();
             let mgEventsPSH = await sampleEventsMG({}, transactionIDs, MGplans, dateFrom, dateTo, db, miModel);
           /*  console.log("mongodb 4")
          console.log("----")
          console.log("MGResult--",MGresult.length)
          console.log("MIResult--",MIresult.length)*/
            var output=[];
            //var ctr = 0;
            await events.rows.forEach(async function  (event, index) {
             //console.log(ctr+"-----")
              //ctr = ctr + 1;
              var lob = "MI";
              var planID = event.PLAN_ID;
              if(planID === null) {
                lob = "MG";
                /*planID = event.YEAR + "-" + event.PLAN_NUMBER + "-" + event.PLAN_OPTION + "-" 
                + event.RX_NUMBER + "-"  + event.PDP_NUMBER;*/
                planID = `${event.YEAR}-${event.PLAN_NUMBER}-${event.PLAN_OPTION}-${event.RX_NUMBER}-${event.PDP_NUMBER}`;
              }
              var timeCached = moment(event.TIME_CACHED).tz('America/New_York')
              //console.log("=======")
              //console.log(JSON.stringify(event))
              var outputObj = {
                "LOB": lob,
                "TRANSACTION_ID": (event.TRANSACTIONID !== undefined )? event.TRANSACTIONID : "",
                "PLAN_YEAR": (event.YEAR !== null )? event.YEAR : planID.substring(14, 18),
                "PLAN_ID": planID,
                "CACHING_STATUS": (event.MESSAGESENTTOKAFKA === 'Y' )? "Cached Successfully" : "Failed",
                "LAST_CACHED_TIME": timeCached.format('YYYY-MM-DD hh:mm:ss.SSSS A'),
                "SERVICE_NAME": event.SERVICE_NAME
              };
              var timeCachedMinus1Sec = timeCached.subtract(2,"minutes");
              var result ;
              if (lob === "MG") {
                result = await MGresult.filter(
                  el => el._PlanIdentifier === planID +"-"  &&
                  moment.duration(moment(moment(el.Product.About.LastSyncTime).format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(timeCachedMinus1Sec)).asMinutes() > 0
                  
                );
              } else {
                result = await MIresult.filter(
                  el => el._PlanIdentifier === planID &&
                  moment.duration(moment(moment(el.Product.About.LastSyncTime).format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(timeCachedMinus1Sec)).asMinutes() > 0
                );
              }
              
              const today = moment();
              var diff = moment.duration(moment(today.format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(timeCached)).asMinutes();
              //console.log(diff+"-------")
             // console.log(result.length)
             
              outputObj.SYNC_TO_PSH = "N/A"
              if(outputObj.CACHING_STATUS !== "Failed") {
                if(result.length > 0) {
                  outputObj.SYNC_TO_PSH = "Yes"
                } else {
                  outputObj.SYNC_TO_PSH = "No"
                  if(mgEventsPSH.length > 0 && event.TRANSACTIONID.includes("Delete") || mgEventsPSH.length > 0 && diff > 10) {
                    outputObj.SYNC_TO_PSH = "Yes"
                  } else if(miEventsPSH.length > 0 && event.TRANSACTIONID.includes("Delete") || miEventsPSH.length > 0 && diff > 10) {
                    outputObj.SYNC_TO_PSH = "Yes"
                  }
                }
              } else {
                if(diff < 10 ) {
                  outputObj.EVENT_STATUS = "Pending";
                }
              }
              //console.log("planID",planID + " - status:",event.PLAN_STATUS)
              //console.log(event.PLAN_STATUS);

              if(outputObj.SYNC_TO_PSH === 'Yes' && lob !== "MG") {
                if(!((event.PLAN_STATUS ===  'Approved' ||
                event.PLAN_STATUS ===  'Proposed' ||
                event.PLAN_STATUS ===  'Active' ||
                event.PLAN_STATUS ===  'Inactive' ) && 
                (event.LIFE_CYCLE ===  'Post Filing' ||
                event.LIFE_CYCLE ===  'Desk Review' ||
                event.LIFE_CYCLE ===  'Benchmark' ||
                event.LIFE_CYCLE ===  'Post-Benchmark' ||
                event.LIFE_CYCLE ===  'CMS Approved' ))) {

                  if(event.TRANSACTIONID.includes("Delete") && diff > 10 ){
                    outputObj.EVENT_STATUS = "OnTime"
                    //console.log("planID",planID)
                  }else{
                    outputObj.EVENT_STATUS = "Suppressed"
                    //console.log("planID",planID)
                  }                 
                }
              }
              output.push(outputObj)
            });
            //console.log(output)
           // callback(output);
            isSyncdb(output, MGresult, MIresult, miEventsPSH, mgEventsPSH).then(async(response)=>{
             // console.log("isSyncDb")
              //console.log(response)
              var out = [];
              /*console.log(isErrorOnly+"------")
              console.log(JSON.stringify(isErrorOnly))
              console.log(JSON.stringify(isErrorOnly) === "false")
              console.log(isErrorOnly === false)
              console.log(String(isErrorOnly) === "false")
              console.log(response.length)*/
              
              invalidEvents(oracleConn, response, transactionIDs, dateFrom, dateTo, db, miModel) .then(async(invalidEventsResponse)=>{
               // callback(response);
               //console.log("invalid events-")
               //console.log(invalidEventsResponse)
               
              await invalidEventsResponse.forEach(async function  (event, index) {
               // console.log("=====1=======")
                var eventTime = moment(event.ProductEvent.EventTime,"YYYY-MM-DD hh:mm:ss.SSSS");
               // console.log(event)
                var outputObj = {
                  "LOB": event.ProductEvent.EventEntity.substring(0, 2),
                  "TRANSACTION_ID": event.ProductEvent.TransactionID,
                  "PLAN_YEAR": (event.ProductEvent.EventEntity.substring(0, 2) === 'MI' )? event.ProductEvent.EventIdentifier.substring(14, 18) : event.ProductEvent.EventIdentifier.substring(0, 4) ,
                  "PLAN_ID": event.ProductEvent.EventIdentifier,
                  "CACHING_STATUS": "",
                  "LAST_CACHED_TIME": eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A'),
                  "SYNC_TO_PSH": "",
                  "EVENT_TYPE": event.ProductEvent.EventName,
                  "EVENT_STATUS": "Invalid"
                };
                response.push(outputObj)
              });
              if(String(isErrorOnly) === "true") {
                //console.log("1")
              await response.forEach(async function  (event, index) {
                if(event.CACHING_STATUS === "Failed" || 
                event.SYNC_TO_PSH === "No" || 
                event.EVENT_STATUS === "Lost" || 
                event.EVENT_STATUS === "Insert missing" || 
                event.EVENT_STATUS === "Invalid"|| 
                event.EVENT_STATUS === "Delayed") {
                  out.push(event)
                }
              });
              
              callback(out);
            } else {
              
            // console.log(JSON.stringify(response))
              callback(response);
            }
              }).catch((err)=>{
                console.error(err);
              });

            }).catch((err)=>{
              console.error(err);
            });

            /*compareRx(envName, planYear,oracleRx.rows) .then(async(response)=>{
              if (oracleConn) {
                try {
                  await oracleConn.close();
                } catch (err) {
                  console.error(err);
                }
              }

              invalidRX(envName, planYear,response) .then(async(response)=>{
                callback(response);
              }).catch((err)=>{
                console.error(err);
              });
                    
            }).catch(async (err)=>{
              if (oracleConn) {
                try {
                  await oracleConn.close();
                } catch (err) {
                  console.error(err);
                }
              }
            });*/
          } else {
            var response = []
            invalidEvents(oracleConn, response, [], dateFrom, dateTo, db, miModel) .then(async(invalidEventsResponse)=>{
            await invalidEventsResponse.forEach(async function  (event, index) {
              // console.log("=====1=======")
               var eventTime = moment(event.ProductEvent.EventTime,"YYYY-MM-DD hh:mm:ss.SSSS");
              // console.log(event)
               var outputObj = {
                 "LOB": event.ProductEvent.EventEntity.substring(0, 2),
                 "TRANSACTION_ID": event.ProductEvent.TransactionID,
                 "PLAN_YEAR": (event.ProductEvent.EventEntity.substring(0, 2) === 'MI' )? event.ProductEvent.EventIdentifier.substring(14, 18) : event.ProductEvent.EventIdentifier.substring(0, 4) ,
                 "PLAN_ID": event.ProductEvent.EventIdentifier,
                 "CACHING_STATUS": "",
                 "LAST_CACHED_TIME": eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A'),
                 "SYNC_TO_PSH": "",
                 "EVENT_TYPE": event.ProductEvent.EventName,
                 "EVENT_STATUS": "Invalid"
               };
               response.push(outputObj)
             });
             if(String(isErrorOnly) === "true") {
               //console.log("1")
               var out = [];
             await response.forEach(async function  (event, index) {
               if(event.CACHING_STATUS === "Failed" || 
               event.SYNC_TO_PSH === "No" || 
               event.EVENT_STATUS === "Lost" || 
               event.EVENT_STATUS === "Insert missing" || 
               event.EVENT_STATUS === "Invalid"|| 
               event.EVENT_STATUS === "Delayed") {
                 out.push(event)
               }
             });
             
             callback(out);
           } else {
             console.log(JSON.stringify(response))
             callback(response);
           }
          }).catch((err)=>{
            console.error(err);
          });
          }
        } else {
          logger.log.error('error occured is ' + err);
        }
      });
    });
    } else {
      callback(err);
    }
  });
}

async function isSync(envName, events) {
  return new Promise((resolve, reject) => {
    config.loadConfig(envName, async (gConfig, err) => {
      if (gConfig) {
        mongodb.connect(gConfig, async (db, err) => {
          var out = [];

          

          await events.forEach(async function  (event, index) {
            let result;
            if (event.LOB === "MG") {

              result = await db.collection('mg_products').find({'_PlanIdentifier': event.PLAN_ID + "-"}).toArray();
            } else {
              result = await db.collection('mi_products').find({'_PlanIdentifier': event.PLAN_ID}).toArray();
            }
//console.log(result.length)
if(result.length > 0) {
  event.SYNC_TO_PSH = "Yes"
} else {
  if(event.TRANSACTIONID.includes("Delete")){
    event.SYNC_TO_PSH = "Yes"
  }else{
    event.SYNC_TO_PSH = "No"
  }
  
}
            /*var createdDT = moment(oraRX.CREATED_DT).tz('America/New_York')
            var modifiedDT = moment(oraRX.MODIFIED_DT).tz('America/New_York')
            var duration = moment.duration(modifiedDT.diff(createdDT));
            var secsDiff = duration.asSeconds();

            oraRX.Event_Status = "Lost";
            oraRX.Event_TransactionID = "";
            oraRX.Event_Type = "";
            oraRX.Event_Time = "";
            oraRX.Event_Identifier = "";
            oraRX.Insert_Event_TransactionID = "";
            oraRX.CREATED_DT = createdDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            oraRX.MODIFIED_DT = modifiedDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            if(secsDiff<5 && oraRX.STATUS !== 'D') {
              //insert
              await combineRxOraData(oraRX, result,createdDT, 'Insert', db);
            } else if (secsDiff>5 && oraRX.STATUS !== 'D') {
              //update
              await combineRxOraData(oraRX, result,modifiedDT, 'Update', db);
            } else if(secsDiff>5 && oraRX.STATUS === 'D') {
              //delete
              await combineRxOraData(oraRX, result,modifiedDT, 'Delete', db);
            }*/

          });
          resolve(events) ;
        });
      }
    });
  })
}


async function isSyncdb(events, MGresult, MIresult, miEventsPSH, mgEventsPSH) {
  return new Promise(async(resolve, reject)  => {
   console.log("isSyncdb")
          var out = [];
        
          var noInsertEvent = false;
          var pshMIEvent = {};

          

          await events.forEach(async function  (event, index) {
            var actualEvent ;
            if (event.LOB === "MG") {
              
              actualEvent = await mgEventsPSH.filter(
                el => el.ProductEvent.EventIdentifier === event.PLAN_ID +"-" && el.ProductEvent.TransactionID === event.TRANSACTION_ID
              );
              pshMIEvent = await mgEventsPSH.filter(
                el => el.ProductEvent.EventIdentifier === event.PLAN_ID +"-" && el.ProductEvent.EventName === 'Insert'
              );
              
              if (pshMIEvent.length > 0) {
                //console.log("----")
                noInsertEvent = false;
              } else {
                noInsertEvent = true;
              }
            } else {
              actualEvent = await miEventsPSH.filter(
                el => el.ProductEvent.EventIdentifier === event.PLAN_ID && el.ProductEvent.TransactionID === event.TRANSACTION_ID
              ); 
              pshMIEvent = await miEventsPSH.filter(
                el => el.ProductEvent.EventIdentifier === event.PLAN_ID && el.ProductEvent.EventName === 'Insert'
              );
              //console.log("------"+pshMIEvent.length)
              if (pshMIEvent.length > 0) {
                //console.log("----")
                noInsertEvent = false;
              } else {
                noInsertEvent = true;
              }
            }
            
            if(event.EVENT_STATUS !== 'Suppressed') {
              event.EVENT_STATUS = "Lost";
              if(event.TRANSACTION_ID != null && event.TRANSACTION_ID.includes("Delete") && event.SYNC_TO_PSH !== "No"){
                event.EVENT_STATUS = "OnTime"
              }
            }
            event.EVENT_TYPE = " ";
            //console.log(event.CACHING_STATUS)
            if(event.CACHING_STATUS !== "Failed" && event.SYNC_TO_PSH !== "No") {
              
              //console.log("---------9" +  event.TRANSACTION_ID);
             /* if(event.TRANSACTION_ID === 'RealTime_H0028-033-000-2023_0223202207064596') {
                console.log(actualEvent.length)
                console.log(noInsertEvent)
                console.log("-----10")
              }*/
              if(actualEvent.length > 0 && actualEvent[actualEvent.length-1].ProductEvent.Suppressed === 'Y') {
                event.EVENT_STATUS = "Suppressed";
                event.EVENT_TYPE = "Update";
                return;
              }
              var result ;
              /*if (event.LOB === "MG") {
                console.log("MG----------")
                /*result = await MGresult.filter(
                  el => el._PlanIdentifier === event.PLAN_ID +"-" 
                );*/
                /*pshMIEvent = await mgEventsPSH.filter(
                  el => el.ProductEvent.EventIdentifier === event.PLAN_ID +"-" && el.ProductEvent.EventName === 'Insert'
                );
                console.log("MG---: " + pshMIEvent.length)
              } else {*/
                //console.log("MI----------")
               /* result = await MIresult.filter(
                  el => el._PlanIdentifier === event.PLAN_ID
                );*/
               /*pshMIEvent = await miEventsPSH.filter(
                  el => el.ProductEvent.EventIdentifier === event.PLAN_ID && el.ProductEvent.EventName === 'Insert'
                );
                //console.log(pshMIEvent.length)
//console.log("pshMIEvent.length: " + pshMIEvent);
              
               
              }*/

             // console.log(actualMIEvent)
             // console.log("expecting delete event")
              if(actualEvent.length > 0){
               // console.log(actualEvent[actualEvent.length-1].ProductEvent.EventName)
           
                event.EVENT_TYPE = actualEvent[actualEvent.length-1].ProductEvent.EventName
              } else {
                if(event.SERVICE_NAME.includes("Delete")) {
                  event.EVENT_TYPE = "Delete"
                } else if (noInsertEvent) {
                // console.log(event.PLAN_ID)
                  event.EVENT_TYPE = "Insert"
                } else if (!noInsertEvent) {
                  //console.log("insert---1")
                  event.EVENT_TYPE = "Update"
                }
              }
              if(event.EVENT_STATUS === 'Suppressed') {
                return;
              }
              if(actualEvent.length === 0) {
                //console.log(event.LAST_CACHED_TIME)
                //console.log(event.LAST_CACHED_TIME)
                var timeCached = moment(event.LAST_CACHED_TIME,"YYYY-MM-DD hh:mm:ss.SSSS A");
                const today = moment();
                var diff = moment.duration(moment(today.format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(timeCached)).asMinutes();
               // console.log(diff)
                if(diff < 10 ) {
                  event.EVENT_STATUS = "Pending";
                  return;
                } else {
                  if(noInsertEvent) {
                    if(parseInt(event.PLAN_YEAR) < 2021) {
                      event.EVENT_STATUS = "Insert missing";
                      return ;
                    }
                  }
                }
              }
             /* if(event.TRANSACTION_ID === 'RealTime_H0028-045-000-2023_0222202206582413') {
                
                console.log("testing ----1")
              }*/
              if(actualEvent.length > 0 &&
                actualEvent[actualEvent.length-1].ProductEvent.EventName !== 'Insert') {
              /*    
              if(event.TRANSACTION_ID === 'RealTime_H0028-033-000-2023_0223202207064596') {
                console.log("ppasok dapat dito")
                console.log("pleanyear" + event.PLAN_YEAR)
              }*/
                  
                if(noInsertEvent) {
                  if(parseInt(event.PLAN_YEAR) > 2021) {
                    event.EVENT_STATUS = "Insert missing";
                    return ;
                  }
                }
              }
             
              //console.log("time cached")
              //console.log(isInsert)
              //console.log(timeCached);
              if(!noInsertEvent && actualEvent.length > 0) {
                //console.log("dito")
                
                if(actualEvent[actualEvent.length-1].ProductEvent.Suppressed === 'Y') {
                  event.EVENT_STATUS = "Suppressed";
                } else {
                  //console.log(event)
                  var timeCached = moment(event.LAST_CACHED_TIME,"YYYY-MM-DD hh:mm:ss.SSSS A").tz('America/New_York')
                 // console.log(actualMIEvent)
                  var eventTime = moment(moment(actualEvent[actualEvent.length-1].ProductEvent.EventTime).format('YYYY-MM-DDTHH:mm:ss.SSSS'));
                  var eventDuration = moment.duration(eventTime.diff(timeCached));
                  var eventDiff = eventDuration.asMinutes();
                  //console.log(timeCached.format('YYYY-MM-DD hh:mm:ss.SSSS A'))
                 // console.log(eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A'))
                 // console.group(eventDiff+"----")
                  if(eventDiff <= 10 ) {
                    event.EVENT_STATUS = "OnTime";
                  } else if(eventDiff > 10 ) {
                    event.EVENT_STATUS = "Delayed";
                  }
                  
                }
              } else {
                if(actualEvent.length > 0 && actualEvent[actualEvent.length-1].ProductEvent.EventName !== 'Insert') {
                  var timeCached = moment(event.LAST_CACHED_TIME,"YYYY-MM-DD hh:mm:ss.SSSS A").tz('America/New_York')
                 // console.log(actualMIEvent)
                  var eventTime = moment(moment(actualEvent[actualEvent.length-1].ProductEvent.EventTime).format('YYYY-MM-DDTHH:mm:ss.SSSS'));
                  var eventDuration = moment.duration(eventTime.diff(timeCached));
                  var eventDiff = eventDuration.asMinutes();
                  //console.log(timeCached.format('YYYY-MM-DD hh:mm:ss.SSSS A'))
                 // console.log(eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A'))
                 // console.group(eventDiff+"----")
                  if(eventDiff <= 10 ) {
                    event.EVENT_STATUS = "OnTime";
                  } else if(eventDiff > 10 ) {
                    event.EVENT_STATUS = "Delayed";
                  }
               }
              }
            } else {
              event.EVENT_STATUS = "N/A";
            }
            
            /*var createdDT = moment(oraRX.CREATED_DT).tz('America/New_York')
            var modifiedDT = moment(oraRX.MODIFIED_DT).tz('America/New_York')
            var duration = moment.duration(modifiedDT.diff(createdDT));
            var secsDiff = duration.asSeconds();

            oraRX.Event_Status = "Lost";
            oraRX.Event_TransactionID = "";
            oraRX.Event_Type = "";
            oraRX.Event_Time = "";
            oraRX.Event_Identifier = "";
            oraRX.Insert_Event_TransactionID = "";
            oraRX.CREATED_DT = createdDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            oraRX.MODIFIED_DT = modifiedDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            if(secsDiff<5 && oraRX.STATUS !== 'D') {
              //insert
              await combineRxOraData(oraRX, result,createdDT, 'Insert', db);
            } else if (secsDiff>5 && oraRX.STATUS !== 'D') {
              //update
              await combineRxOraData(oraRX, result,modifiedDT, 'Update', db);
            } else if(secsDiff>5 && oraRX.STATUS === 'D') {
              //delete
              await combineRxOraData(oraRX, result,modifiedDT, 'Delete', db);
            }*/

          });
          resolve(events) ;
        });
      
}

async function compareRx(envName, planYear, oracleRx) {
  return new Promise((resolve, reject) => {
    config.loadConfig(envName, async (gConfig, err) => {
      if (gConfig) {
        mongodb.connect(gConfig, async (db, err) => {

          let result = await db.collection('mg_events').find({'ProductEvent.EventEntity': 'MG-RxMapping'}).toArray();

          await oracleRx.forEach(async function  (oraRX, index) {

            var createdDT = moment(oraRX.CREATED_DT).tz('America/New_York')
            var modifiedDT = moment(oraRX.MODIFIED_DT).tz('America/New_York')
            var duration = moment.duration(modifiedDT.diff(createdDT));
            var secsDiff = duration.asSeconds();

            oraRX.Event_Status = "Lost";
            oraRX.Event_TransactionID = "";
            oraRX.Event_Type = "";
            oraRX.Event_Time = "";
            oraRX.Event_Identifier = "";
            oraRX.Insert_Event_TransactionID = "";
            oraRX.CREATED_DT = createdDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            oraRX.MODIFIED_DT = modifiedDT.format('YYYY-MM-DD hh:mm:ss.SSSS A')
            if(secsDiff<5 && oraRX.STATUS !== 'D') {
              //insert
              await combineRxOraData(oraRX, result,createdDT, 'Insert', db);
            } else if (secsDiff>5 && oraRX.STATUS !== 'D') {
              //update
              await combineRxOraData(oraRX, result,modifiedDT, 'Update', db);
            } else if(secsDiff>5 && oraRX.STATUS === 'D') {
              //delete
              await combineRxOraData(oraRX, result,modifiedDT, 'Delete', db);
            }

          });
          resolve(oracleRx) ;
        });
      }
    });
  })
}

async function combineRxOraData(oraRX, result, modifiedDT, eventName, oracleDB) {
  let mongoRxList = await result.filter(
    el => el.ProductEvent.EventIdentifier.includes(oraRX.RX_CODE) && el.ProductEvent.EventName === eventName &&
    moment.duration(moment(moment(el.ProductEvent.EventTime).format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(modifiedDT)).asMinutes() > 0
  );
  if(mongoRxList.length > 0) {
    await mongoRxList.every(async function (mongoRx, index) {

      var eventTime = moment(moment(mongoRx.ProductEvent.EventTime).format('YYYY-MM-DDTHH:mm:ss.SSSS'));
      var eventDuration = moment.duration(eventTime.diff(modifiedDT));
      var eventDiff = eventDuration.asMinutes();

      oraRX.Event_TransactionID = mongoRx.ProductEvent.TransactionID;
      oraRX.Event_Type = mongoRx.ProductEvent.EventName;
      oraRX.Event_Time = eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A');
      oraRX.Event_Identifier = mongoRx.ProductEvent.EventIdentifier;
      if(eventName !== 'Insert') {
        let insertEvent = await result.filter(
          el => el.ProductEvent.EventIdentifier === mongoRx.ProductEvent.EventIdentifier && el.ProductEvent.EventName === 'Insert');
        if(insertEvent.length === 0) {
          oraRX.Event_Status = "Insert missing";
          return false;
        } else {
          oraRX.Insert_Event_TransactionID = insertEvent[0].ProductEvent.TransactionID;
        }
      } else {
        oraRX.Insert_Event_TransactionID = mongoRx.ProductEvent.TransactionID;
      }
      if(eventDiff <= 10 ) {
        oraRX.Event_Status = "OnTime";
        return false;
      } else if(eventDiff > 10 ) {
        oraRX.Event_Status = "Delayed";
        return false;
      }

      return true;
    });
  } else {
    const today = moment();
    var diff = moment.duration(moment(today.format('YYYY-MM-DDTHH:mm:ss.SSSS')).diff(modifiedDT)).asMinutes();
    
    if(diff < 10 ) {
      oraRX.Event_Status = "Pending";
    } else {
      let insertEvent = await result.filter(
        el => el.ProductEvent.RxCode === oraRX.RX_CODE && el.ProductEvent.EventName === 'Insert');
      if(insertEvent.length === 0) {
        oraRX.Event_Status = "Insert missing";
        return false;
      } else {
        oraRX.Insert_Event_TransactionID = insertEvent[0].ProductEvent.TransactionID;
      }
    }
  }
}


async function invalidEvents(oracleConn, response, transactionIDs, dateFrom, dateTo, PSHdb, miModel) {
  return new Promise(async (resolve, reject) => {
    console.log("invalidevents")
    var dateFromNewFormat = dateFrom.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
    var dateToNewFormat = dateTo.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
    const d = new Date("2022-01-26T13:42:00.000Z")
    const dateFromFin = new Date(dateFromNewFormat)
    const dateToFin = new Date(dateToNewFormat)
/*console.log(dateFromFin)
console.log(dateToFin)
console.log(transactionIDs)*/
var fromDate = new Date(2022,0,26).toLocaleString("en-US", {timeZone: "America/New_York"});

       // console.log(fromDate)
    var MIInvalidEvents = await PSHdb.collection('mi_events').aggregate([
      {
        $addFields: {
          
          date: {
            $dateFromString: {
                dateString: "$ProductEvent.EventTime"
            }
        }
        }
      },
      { $match : {
        'ProductEvent.TransactionID':{$nin:transactionIDs},
        date: {
          $gt: dateFromFin,
          $lt: dateToFin
        },
        'ProductEvent.Suppressed': { $ne: 'Y'}
        } 
      }
    ]).toArray();;
    //console.log("MIInvalidEvents",MIInvalidEvents)
    var MGInvalidEvents = await PSHdb.collection('mg_events').aggregate([
      {
        $addFields: {
          
          date: {
            $dateFromString: {
                dateString: "$ProductEvent.EventTime"
            }
        }
        }
      },
      { $match : {
        'ProductEvent.TransactionID':{$nin:transactionIDs},
        date: {
          $gt: dateFromFin,
          $lt: dateToFin
        },
        'ProductEvent.Suppressed': { $ne: 'Y'},
        'ProductEvent.EventEntity': { $ne: 'MG-RxMapping'}
        
        } 
      }
    ]).toArray();;
   // console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)
   // console.log("MGInvalidEvents.length: " + MGInvalidEvents.length)
    MIInvalidEvents.push(...MGInvalidEvents);
   // console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)
    //console.log(dateFromNewFormat)
   // console.log(dateToNewFormat)
            //resolve(MIInvalidEvents)

            try {
              let transactionArray = [];
              for (let i = 0; i < MIInvalidEvents.length; i++) {
                let actualTransaction = MIInvalidEvents[i].ProductEvent.TransactionID;
                transactionArray.push(actualTransaction)
              }

               let actualEvent = transactionArray.join("','");

               const eventsFilter = await oracleConn.execute(
                `select * from PRODUCT_CACHE_TRANS_LOG
                where TRANSACTIONID in ('`+actualEvent+`')`,[], { outFormat: oracledb.OUT_FORMAT_OBJECT });

                if(eventsFilter.rows.length > 0){
                  for (let j = 0; j < transactionArray.length; j++) {
                    for (let k = 0; k < MIInvalidEvents.length; k++) {
                      if (transactionArray[j] === MIInvalidEvents[k].ProductEvent.TransactionID) {
                        MIInvalidEvents.splice(k, 1);
                        }
                    }                 
                  }
                }             
            } catch (error) {
              console.error(error);
            }

            resolve(MIInvalidEvents);
  })
  
}


async function sampleEventsMG(response, transactionIDs, MGPlans, dateFrom, dateTo, PSHdb, miModel) {
  
  //console.log("sampleEventsMG start")
  var dateFromNewFormat = dateFrom.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
  var dateToNewFormat = dateTo.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
  const d = new Date("2022-01-26T13:42:00.000Z")
  const dateFromFin = new Date(dateFromNewFormat)
  const dateToFin = new Date(dateToNewFormat)
//console.log(dateFromFin)
//console.log(dateToFin)
//console.log(transactionIDs)
var fromDate = new Date(2022,0,26).toLocaleString("en-US", {timeZone: "America/New_York"});

     // console.log(fromDate)
  /*var MIInvalidEvents = await PSHdb.collection('mi_events').aggregate([
    {
      $addFields: {
        
        date: {
          $dateFromString: {
              dateString: "$ProductEvent.EventTime"
          }
      }
      }
    },
    { $match : {
      'ProductEvent.TransactionID':{$in:transactionIDs},
      date: {
        $gt: dateFromFin,
        $lt: dateToFin
      }
      
      } 
    }
  ]).toArray();;*/
  var MGInvalidEvents = await PSHdb.collection('mg_events').aggregate([
    {
      $addFields: {
        
        date: {
          $dateFromString: {
              dateString: "$ProductEvent.EventTime"
          }
      }
      }
    },
    { $match : {
      'ProductEvent.EventIdentifier':{$in:MGPlans},
      $or: [{ 'ProductEvent.EventName': 'Insert' }, { 'ProductEvent.TransactionID': {$in:transactionIDs} }]
      /*date: {
        $gt: dateFromFin
        //,$lt: dateToFin
      }*/
      
      } 
    }
  ]).toArray();;
  /*console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)
  console.log("MGInvalidEvents.length: " + MGInvalidEvents.length)
  MIInvalidEvents.push(...MGInvalidEvents);
  console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)*/
        //console.log(MIInvalidEvents)
  //console.log(dateFromNewFormat)
// console.log(dateToNewFormat)
//console.log(MGInvalidEvents)
// console.log("sampleEventsMG end")
          return MGInvalidEvents;


}
async function sampleEventsMI(response, transactionIDs, MIPlans, dateFrom, dateTo, PSHdb, miModel) {
  
  //console.log("sampleEventsMI start")
    var dateFromNewFormat = dateFrom.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
    var dateToNewFormat = dateTo.format('YYYY-MM-DDTHH:mm:ss.SSSS').substring(0, 23)+'Z';
    const d = new Date("2022-01-26T13:42:00.000Z")
    const dateFromFin = new Date(dateFromNewFormat)
    const dateToFin = new Date(dateToNewFormat)
/*console.log(dateFromFin)
console.log(dateToFin)
console.log(transactionIDs)*/
var fromDate = new Date(2022,0,26).toLocaleString("en-US", {timeZone: "America/New_York"});

       // console.log(fromDate)
    var MIInvalidEvents = await PSHdb.collection('mi_events').aggregate([
      {
        $addFields: {
          
          date: {
            $dateFromString: {
                dateString: "$ProductEvent.EventTime"
            }
        }
        }
      },
      { $match : {
        'ProductEvent.EventIdentifier':{$in:MIPlans},
        $or: [{ 'ProductEvent.EventName': 'Insert' }, { 'ProductEvent.TransactionID': {$in:transactionIDs} }]
       /* date: {
          $lt: dateToFin
         // ,$lt: dateToFin
        }*/
        
        } 
      }
    ]).toArray();;
    /*var MGInvalidEvents = await PSHdb.collection('mg_events').aggregate([
      {
        $addFields: {
          
          date: {
            $dateFromString: {
                dateString: "$ProductEvent.EventTime"
            }
        }
        }
      },
      { $match : {
        'ProductEvent.TransactionID':{$in:transactionIDs},
        date: {
          $gt: dateFromFin,
          $lt: dateToFin
        }
        
        } 
      }
    ]).toArray();;*/
    /*console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)
    console.log("MGInvalidEvents.length: " + MGInvalidEvents.length)
    MIInvalidEvents.push(...MGInvalidEvents);
    console.log("MIInvalidEvents.length: " + MIInvalidEvents.length)*/
          //console.log(MIInvalidEvents)
    //console.log(dateFromNewFormat)
   // console.log(dateToNewFormat)
   //console.log("sampleEventsMI end")
            return MIInvalidEvents;

  
}

async function invalidRX(envName, planYear, outputRX) {
  return new Promise((resolve, reject) => {
    config.loadConfig(envName, (gConfig, err) => {
      if (gConfig) {
        oracledb.connect(gConfig, false, async (oracleConn, err) => {
          if(oracleConn) {
                  
            const oracleRx = await oracleConn.execute(
              `SELECT DISTINCT RX_CODE
              FROM PORTAL_GRP_RX_CODE
              where PLAN_YEAR = `+ planYear+` and
              PORTAL_GRP_RX_CODE.STATUS in ('U', 'D')`,
              [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

            if(oracleRx.rows.length > 0) {
              arrRxCodes = [];
              oracleRx.rows.forEach(async function (oraRX, index) {
                arrRxCodes.push(oraRX[0]);
              });
              
              compareInvalidRx(envName, planYear,arrRxCodes, outputRX) .then(async(response)=>{
                resolve(response) ;
             });
            } else {
              resolve(outputRX)
            }
          } else {
              logger.log.error('error occured is ' + err);
          }
        });
      } else {
        callback(err);
      }
    });
  })
  
}


async function compareInvalidRx(envName, planYear, oracleRx, outputRX) {
  return new Promise((resolve, reject) => {
    config.loadConfig(envName, async (gConfig, err) => {
      if (gConfig) {
        mongodb.connect(gConfig, async (db, err) => {
          var strPlanYear = JSON.stringify(planYear);
          var regExPlanYr = { '$regex': planYear};

          let result = await db.collection('mg_events').find({'ProductEvent.EventIdentifier': regExPlanYr, 'ProductEvent.EventEntity': 'MG-RxMapping','ProductEvent.EventName': 'Insert', 'ProductEvent.RxCode': { '$nin': oracleRx }}).toArray();
          
          if(result.length > 0) {
            arrRxCodes = [];
            result.forEach(async function (mongoRx, index) {
                  
              var eventTime = moment(moment(mongoRx.ProductEvent.EventTime).format('YYYY-MM-DDTHH:mm:ss.SSSS'));
              const RxCode = mongoRx.ProductEvent.EventIdentifier.split("-");
              const RX = {
                PLAN_YEAR: planYear,
                RX_CODE: RxCode[5],
                CREATED_DT: '',
                MODIFIED_DT: '',
                STATUS: '',
                STATUS_1:'',
                Insert_Event_TransactionID: mongoRx.ProductEvent.TransactionID,
                Event_Status: 'Invalid',
                Event_TransactionID: mongoRx.ProductEvent.TransactionID,
                Event_Type: mongoRx.ProductEvent.EventName,
                Event_Time: eventTime.format('YYYY-MM-DD hh:mm:ss.SSSS A'),
                Event_Identifier: mongoRx.ProductEvent.EventIdentifier
              }

              outputRX.push(RX)
            });
          }
          resolve(outputRX) ;
        });
        //return oracleRx;
      }
    });
  })
  
}
//generateRxEvent(2021, "DEV");
module.exports.generateMiMgEvents = generateMiMgEvents;
