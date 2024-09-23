const mongodb = require("../commonConfig/db/mongodb.js");
var crypto = require('crypto');
const https = require("https");
const logger = require('../commonConfig/Main/logger.js');
const axios = require("axios");
const oracledb = require("../commonConfig/db/oracledb.js");
const config = require("../commonConfig/config/loadConfig.js");
const { response } = require("express");
const {parseStringPromise} = require('xml2js');
const { parse } = require("path");

const request_options = {
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: { "Content-Type": "application/xml" },
  secureProtocol: "TLSv1_2_method",
};


async function syncMIPlans(planYear,env, callback) {
  console.log(planYear);
  console.log(env);
      config.loadConfig(env, async (gConfig, err) => {
      if (gConfig) {
        oracledb.connect(gConfig, true, async (oracleConn, oracleDbErr) => {
          if (oracleDbErr) {
            console.error(oracleDbErr)
            callback("Failed");
          }
          mongodb.connect(gConfig, async (db, mongoDbErr) => {
            if (mongoDbErr) {
              console.error(mongoDbErr)
              callback("Failed");
            }
            if (oracleConn) {
             
  
                const miPlans = await getMissingMIPlans(oracleConn, db,planYear)
                console.log(miPlans);
                callback(miPlans);
  
            }
          })
        })
      }
    })
  }

  async function getMissingMIPlans(oracleConn, db,planYear) {
    const filteredPlanIds=[];
    const pdhMIPlans = await oracleConn.execute(
      `
      WITH FILTEREDQUERY AS (
      select PLAN_ID,TRANSACTIONID,TIME_CACHED,
      ROW_NUMBER() OVER (PARTITION BY PLAN_ID ORDER BY TIME_CACHED DESC) as rn
      FROM PRODUCT_CACHE_TRANS_LOG  WHERE YEAR = `+planYear+` AND TRANSACTIONID IS NOT NULL )
      SELECT l.PLAN_ID,l.TRANSACTIONID,l.TIME_CACHED FROM FILTEREDQUERY l
      LEFT JOIN (
      SELECT DISTINCT PLAN_ID FROM PRODUCT_CACHE_TRANS_LOG WHERE SERVICE_NAME = 'MIDeletePlanRequest' 
      )d ON l.PLAN_ID =d.PLAN_ID
      WHERE d.PLAN_ID IS NULL AND l.rn=1
        
      `
    )
  
    const oracleData= pdhMIPlans.rows.map(item => ({
      PLAN_ID : item.PLAN_ID,
      TRANSACTIONID : item.TRANSACTIONID
    }));
    console.log(oracleData);
    const miCollection = db.collection('mi_products')
    const query={'Product.PlanHeader.PlanYear': parseInt(planYear)};
    const projection={'Product.PlanHeader.PlanID':1,'Product.About.TransactionID':1}
    const results = await miCollection.find(query).project(projection).toArray();
    const mongomap =new Map();
    results.forEach(item => {
      const planId=item.Product.PlanHeader.PlanID;
      const transactionid=item.Product.About.TransactionID
      mongomap.set(planId,transactionid);
      //console.log(mongomap);
    });
    for(const item of oracleData){
      const oraclePlanId= item.PLAN_ID;
      const oracleTransactionId =item.TRANSACTIONID;
      if (mongomap.has(oraclePlanId)){
        const mongoTrasactionId=mongomap.get(oraclePlanId);
        if(oracleTransactionId !==mongoTrasactionId){
          filteredPlanIds.push(oraclePlanId);
        }
      }
    }
    //console.log(filteredPlanIds);
    return filteredPlanIds
  }

async function updatePlanIds(env,planids,callback){
  config.loadConfig(env, async (gConfig, err) => {
    if (gConfig) {
      oracledb.connect(gConfig, true, async (oracleConn, oracleDbErr) => {
        if (oracleDbErr) {
          console.error(oracleDbErr)
          callback("Failed");
        }
       
          if (oracleConn) {
            const results =[];
              for(const planid of planids){
                //console.log('planid: ',planid);
              const planDetails = await getPlanDetails(oracleConn,planid);
               if(planDetails){
                let endpoint =gConfig.iib.update.plan_endpoint;
                const responseStatus =await sendXmlRequest(planDetails,planid,endpoint);
                //console.log('result: ',responseStatus);
                if(responseStatus[0] ===200){
                results.push({PlanID:planid , Status:'Success'});
                }else{
                  results.push({PlanID:planid , Status: 'Failed'});
                }
                //console.log(results);
               }
              
              }
               callback(results);

          }
        
      })
    }
  })
}
async function getPlanDetails(oracleConn,planids){
  try{
  const planDetails = await oracleConn.execute(
    `
    SELECT * FROM (SELECT * FROM PRODUCT_CACHE_TRANS_LOG WHERE PLAN_ID = :planids ORDER BY TIME_CACHED DESC) WHERE ROWNUM = 1               
    `,[planids]
  );
  const plandetail=planDetails.rows
  return planDetails.rows;
}catch(err){
  console.log(err);
}
}
async function sendXmlRequest(planDetails,planids,endpoint){
  //console.log(endpoint);
  const result=[];
  for(const plandetail of planDetails){  
      var currentdate = new Date();
                var datetime = String(currentdate.getMonth() + 1).padStart(2, "0") + ""
                  + String(currentdate.getDate()).padStart(2, "0") + ""
                  + String(currentdate.getFullYear()) + ""
                  + String(currentdate.getHours()).padStart(2, "0") + ""
                  + String(currentdate.getMinutes()).padStart(2, "0") + ""
                  + String(currentdate.getSeconds()).padStart(2, "0") + ""
                  + String(currentdate.getMilliseconds()).padStart(3, "0") + "";
                const transactionID = 'RealTime_' + planids + "_" + datetime;
                const [contract,pbp,segment,year]=planids.split('-');
      const xmlRequest =`
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:v1="http://schemas.humana.com/Product/Utility/ProductCacheControllerRequest/V1">
          <soap:Header>
          <Transaction>${transactionID}</Transaction>
          </soap:Header>
          <soap:Body>
          <v1:ProductCacheControllerRequest>
          <LOB>Medicare Individual</LOB>
          <CacheOnly>Y</CacheOnly>
          <!--Keep it as N to generate the GPAS files-->
          <Plans>
          <TransactionID>${transactionID}</TransactionID>
          <HPASProductID>${plandetail.HPAS_PRODUCTID}</HPASProductID>
          <PlanID>${planids}</PlanID>
          <Contract>${contract}</Contract>
          <PBP>${pbp}</PBP>
          <Segment>${segment}</Segment>
          <Year>${year}</Year>
          <ProductType>${plandetail.PRODUCT_TYPE}</ProductType>
          <Publish>Y</Publish>
          <PlanStatus>${plandetail.PLAN_STATUS}</PlanStatus>
          <Phase>${plandetail.LIFE_CYCLE}</Phase>
          <PublishDate>02/08/2024</PublishDate>
          </Plans>
          </v1:ProductCacheControllerRequest>
          </soap:Body>
          </soap:Envelope>
        `;
            
        try{
        const responseXml = await axios.post(endpoint, xmlRequest, request_options);
        result.push(responseXml.status);
       // console.log(responseXml.status);
        
        }catch(err){
          console.log(err);
        }
  }
 // console.log(result);
  return result;
}



async function syncMGPlans(planYear,env, callback) {
  console.log("planYear" +planYear);
  console.log(env);
      config.loadConfig(env, async (gConfig, err) => {
      if (gConfig) {
        oracledb.connect(gConfig, true, async (oracleConn, oracleDbErr) => {
          if (oracleDbErr) {
            console.error(oracleDbErr)
            callback("Failed");
          }
          mongodb.connect(gConfig, async (db, mongoDbErr) => {
            if (mongoDbErr) {
              console.error(mongoDbErr)
              callback("Failed");
            }
            if (oracleConn) {
             
  
                const mgPlans = await getMissingMGPlans(oracleConn, db,planYear)
                console.log(mgPlans);
                callback(mgPlans);
  
            }
          })
        })
      }
    })
  }



  async function getMissingMGPlans(oracleConn, db,planYear) {
   // console.log("planYear" +planYear);
    const filteredPlanIds=[];
    const mgPlans = await oracleConn.execute(
      `
      WITH FILTEREDPLANS AS(
      select YEAR, PLAN_NUMBER, PLAN_OPTION, RX_NUMBER, PDP_NUMBER , TRANSACTIONID,TIME_CACHED, ROW_NUMBER() OVER (PARTITION BY PLAN_NUMBER, PLAN_OPTION, RX_NUMBER, PDP_NUMBER ORDER BY TIME_CACHED DESC) AS rn 
      FROM PRODUCT_CACHE_TRANS_LOG  WHERE YEAR = `+planYear+` AND TRANSACTIONID IS NOT NULL AND PLAN_NUMBER IS NOT NULL
      AND PLAN_OPTION IS NOT NULL AND RX_NUMBER IS NOT NULL AND PDP_NUMBER IS NOT NULL)
      SELECT YEAR, PLAN_NUMBER, PLAN_OPTION, RX_NUMBER, PDP_NUMBER , TRANSACTIONID FROM FILTEREDPLANS WHERE rn=1
        
      `
    )
  
    const oracleData= mgPlans.rows.map(item => ({
      PLAN_ID : item.YEAR +"-"+ item.PLAN_NUMBER +"-"+ item.PLAN_OPTION +"-"+item.RX_NUMBER +"-"+ item.PDP_NUMBER ,
      TRANSACTIONID : item.TRANSACTIONID
    }));
    console.log(oracleData);
    const miCollection = db.collection('mg_products')
    const query={'Product.PlanHeader.PlanYear': parseInt(planYear)};
    const projection={'_PlanIdentifier':1,'Product.About.TransactionID':1}
    const results = await miCollection.find(query).project(projection).toArray();
    //console.log(results);
    const mongomap =new Map();
    results.forEach(item => {
      const planId=item._PlanIdentifier;
      const planIdString = typeof planId === 'string' ? planId : String(planId);
     // console.log(planId);
      //console.log(planIdString)
      const modifiedPlanId = planIdString.endsWith("-") ? planIdString.slice(0,-1) :planIdString;
      //console.log(modifiedPlanId);
      const transactionid=item.Product.About.TransactionID
      mongomap.set(modifiedPlanId,transactionid);
      //console.log(mongomap);
      
    });
    // let updatedplanId = mongomap.map(value => {
    //   if(value.planId.endswith("-")){
    //     return{
    //       ...value,
    //       planId:item.planId.slice(0,-1)
    //     };
    //   }
    //   return value;
    // });
    //   console.log(updatedplanId);
    for(const item of oracleData){
      const oraclePlanId= item.PLAN_ID;
      const oracleTransactionId =item.TRANSACTIONID;
      if (mongomap.has(oraclePlanId)){
        const mongoTrasactionId=mongomap.get(oraclePlanId);
        if(oracleTransactionId !==mongoTrasactionId){
          //const mongoPlanID =mongomap.modifiedPlanId;
          filteredPlanIds.push(oraclePlanId + "-");
        }
      }
    }
   // console.log(filteredPlanIds);
    return filteredPlanIds
  }



  async function updatemgPlanIds(env,planids,callback){
    config.loadConfig(env, async (gConfig, err) => {
      if (gConfig) {
        oracledb.connect(gConfig, true, async (oracleConn, oracleDbErr) => {
          if (oracleDbErr) {
            console.error(oracleDbErr)
            callback("Failed");
          }
         
            if (oracleConn) {
              const results =[];
                for(const planid of planids){
                 // console.log('planid: ',planid);
                const planDetails = await getmgPlanDetails(oracleConn,planid);
                 if(planDetails){
                  let endpoint =gConfig.iib.update.plan_endpoint;
                  const responseStatus =await sendmgXmlRequest(planDetails,planid,endpoint);
                 // console.log('result: ',responseStatus);
                  if(responseStatus[0] ===200){
                  results.push({PlanID:planid , Status:'Success'});
                  }else{
                    results.push({PlanID:planid , Status: 'Failed'});
                  }
                  console.log(results);
                 }
                
                }
                 callback(results);
  
            }
          
        })
      }
    })
  }
  async function getmgPlanDetails(oracleConn,planids){
    const[YEAR, PLAN_NUMBER, PLAN_OPTION, RX_NUMBER, PDP_NUMBER]=planids.split("-");
    console.log(YEAR + "+" +PLAN_NUMBER);
    try{
    const planDetails = await oracleConn.execute(
      `
      SELECT * FROM (SELECT * FROM PRODUCT_CACHE_TRANS_LOG where YEAR = :YEAR AND PLAN_NUMBER = :PLAN_NUMBER AND PLAN_OPTION = :PLAN_OPTION AND RX_NUMBER = :RX_NUMBER AND PDP_NUMBER = :PDP_NUMBER ORDER BY TIME_CACHED DESC) WHERE ROWNUM = 1               
      `,[YEAR, PLAN_NUMBER, PLAN_OPTION, RX_NUMBER, PDP_NUMBER]
    );
    const plandetail=planDetails.rows
    return planDetails.rows;
  }catch(err){
    console.log(err);
  }
  }
  async function sendmgXmlRequest(planDetails,planids,endpoint){
    const planIdString = typeof planids === 'string' ? planids : String(planids);
      //console.log(planids);
      const modifiedPlanId = planIdString.endsWith("-") ? planIdString.slice(0,-1) :planIdString;
     // console.log(modifiedPlanId);
   // console.log(endpoint);
    const result=[];
    for(const plandetail of planDetails){  
        var currentdate = new Date();
                  var datetime = String(currentdate.getMonth() + 1).padStart(2, "0") + ""
                    + String(currentdate.getDate()).padStart(2, "0") + ""
                    + String(currentdate.getFullYear()) + ""
                    + String(currentdate.getHours()).padStart(2, "0") + ""
                    + String(currentdate.getMinutes()).padStart(2, "0") + ""
                    + String(currentdate.getSeconds()).padStart(2, "0") + ""
                    + String(currentdate.getMilliseconds()).padStart(3, "0") + "";

                  const transactionID = 'RealTime_' + modifiedPlanId + "_" + datetime;
        const xmlRequest =`
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:v1="http://schemas.humana.com/Product/Utility/ProductCacheControllerRequest/V1">

<soap:Header>

<Transaction>${transactionID}</Transaction>

</soap:Header>

<soap:Body>

<v1:ProductCacheControllerRequest>

<LOB>Medicare Group</LOB>

<CacheOnly>Y</CacheOnly>

<Plans>

<TransactionID>${transactionID}</TransactionID>

<HPASProductID>${plandetail.HPAS_PRODUCTID}</HPASProductID>

<Year>${plandetail.YEAR}</Year>

<GroupName>${plandetail.GROUP_NAME}</GroupName>

<PackageAssociations>

<Plan>${plandetail.PLAN_NUMBER}</Plan>

<Option>${plandetail.PLAN_OPTION}</Option>

<RxNumber>${plandetail.RX_NUMBER}</RxNumber>

<PDPNumber>${plandetail.PDP_NUMBER}</PDPNumber>

</PackageAssociations>

<PlanStatus>${plandetail.PLAN_STATUS}</PlanStatus>

<Phase>${plandetail.LIFE_CYCLE}</Phase>

</Plans>

</v1:ProductCacheControllerRequest>

</soap:Body>

</soap:Envelope>

          `;
              
          try{
          const responseXml = await axios.post(endpoint, xmlRequest, request_options);
          result.push(responseXml.status);
         // console.log(responseXml.status);
          
          }catch(err){
            console.log(err);
          }
    }
   // console.log(result);
    return result;
  }
  

module.exports.syncMIPlans = syncMIPlans;
module.exports.updatePlanIds = updatePlanIds;
module.exports.syncMGPlans = syncMGPlans;
module.exports.updatemgPlanIds =updatemgPlanIds;