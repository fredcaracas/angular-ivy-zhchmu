const config = require("../config/loadConfig.js");
const mongodb = require("../db/mongodb.js");
var MongoClient = require('mongodb').MongoClient;
const oracledb = require("../db/oracledb.js");
const _ = require("lodash");
const axios = require("axios");
var crypto = require("crypto");
const https = require("https");
const { Kafka } = require("kafkajs");
const parseString = require("xml2js").parseString;
const { resolve } = require("path");

const request_options = {
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: { "Content-Type": "application/xml" },
  secureProtocol: "TLSv1_2_method",
};
const RxCoderequest_options = {
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: { "Content-Type": "application/json" },
};

async function syncMIPlans(env, callback) {
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
            try {
              const logData = {
                ExecutionTime: new Date(),
                ExecutionStatus: 'In Process',
                LOB: 'Medicare Individual',
                Data: []
              }

              const miPlans = await getMissingMIPlans(oracleConn, db)
              const currLog = await saveLogs(db, logData)
              let logsArr = []
              if (miPlans.length > 0) {
                console.log(miPlans)
                const deleteResponse = await deleteMIPlans(miPlans, gConfig.iib.delete.plan_endpoint)

                if (deleteResponse == null) {
                  const updateLogData = {
                    ExecutionStatus: 'Failed'
                  }
                  let updateLog = await updateLogs(db, currLog.insertedId, updateLogData)
                  return callback("Failed");
                } else {

                  Promise.all(deleteResponse).then(async (deleteResp) => {
                    for (const dr of deleteResp) {
                      parseString(dr.config.data, (reqErr, parsedRequestXML) => {
                        if (reqErr) {
                          console.error(reqErr)
                        }
                        parseString(dr.data, (respErr, parsedResponseXML) => {
                          if (respErr) {
                            console.error(respErr)
                          }
                          let planID = parsedRequestXML['soap:Envelope']['soap:Body'][0]['v1:DeletePlanRequest'][0]['Plans'][0]['PlanID'][0];
                          let log = {
                            Entity: 'MI',
                            PlanID: planID,
                            PlanYear: planID.substring(14, 18),
                            Status: 'Deleted'
                          }

                          logsArr.push(log)
                          logsArr.sort(function (a, b) { return b.PlanYear - a.PlanYear });
                        })
                      })
                    }
                    const updateLogData = {
                      ExecutionStatus: 'Completed',
                      Data: logsArr
                    }
                    let updateLog = await updateLogs(db, currLog.insertedId, updateLogData)
                    let pfpTest = await deletePFPKeys(db, env)
                    callback('Success')
                  })
                }
              } else {
                const updateLogData = {
                  ExecutionStatus: 'Completed',
                  Data: logsArr
                }
                let updateLog = await updateLogs(db, currLog.insertedId, updateLogData)
                let pfpTest = await deletePFPKeys(db, env)
                callback('Success')
              }

            } catch (error) {
              console.log(error)
              const updateLogData = {
                ExecutionStatus: 'Failed'
              }
              let updateLog = await updateLogs(db, currLog.insertedId, updateLogData)
              callback("Failed");
            }
          }
        })
      })
    }
  })
}

async function syncMGPlans(env, callback) {

  config.loadConfig(env, async (gConfig, err) => {
    if (gConfig) {
      oracledb.connect(gConfig, true, async (oracleConn, oracleErr) => {
        if (oracleErr) {
          console.error(oracleErr);
          callback("Failed");
        }
        mongodb.connect(gConfig, async (db, mongoErr) => {
          if (mongoErr) {
            console.error(mongoErr);
            callback("Failed");
          }
          if (oracleConn) {
            try {
              const logData = {
                ExecutionTime: new Date(),
                ExecutionStatus: "In Process",
                LOB: "Medicare Group",
                MGData: [],
                RXData: [],
              };

              const currMGLog = await saveLogs(db, logData);

              const mgPlans = await getMissingMGPlans(oracleConn, db);

              const rx = await getMissingRx(oracleConn, db);
              let mglogsArr = [];
              let rxlogsArr = [];
              if (mgPlans.length > 0) {
                const deleteMGResponse = await deleteMGPlans(mgPlans, gConfig.planMG_endpoint);

                if (deleteMGResponse == null) {
                  const updateLogData = {
                    ExecutionStatus: 'Failed'
                  }
                  let updateLog = await updateLogs(db, currMGLog.insertedId, updateLogData)
                  return callback("Failed");
                } else {
                  Promise.all(deleteMGResponse).then(async (deleteResp) => {
                    for (const dr of deleteResp) {
                      parseString(dr.config.data, (reqErr, parsedRequestXML) => {
                        if (reqErr) {
                          console.log(reqErr);
                          callback("Failed");
                        }
                        console.log(JSON.stringify(parsedRequestXML));
                        parseString(dr.data, (respErr, parsedResponseXML) => {
                          if (respErr) {
                            callback("Failed");
                          }
                          let log = {
                            PLAN_YEAR:
                              parsedRequestXML["soap:Envelope"]["soap:Body"][0][
                              "v1:DeletePlanRequest"
                              ][0]["Plans"][0]["Year"][0],
                            PLAN_NUMBER:
                              parsedRequestXML["soap:Envelope"]["soap:Body"][0][
                              "v1:DeletePlanRequest"
                              ][0]["Plans"][0]["PackageAssociation"][0][
                              "Plan"
                              ][0],
                            OPTION_NUMBER:
                              parsedRequestXML["soap:Envelope"]["soap:Body"][0][
                              "v1:DeletePlanRequest"
                              ][0]["Plans"][0]["PackageAssociation"][0][
                              "Option"
                              ][0],
                            RX_NUMBER:
                              parsedRequestXML["soap:Envelope"]["soap:Body"][0][
                              "v1:DeletePlanRequest"
                              ][0]["Plans"][0]["PackageAssociation"][0][
                              "RxNumber"
                              ][0],
                            PDP_NUMBER:
                              parsedRequestXML["soap:Envelope"]["soap:Body"][0][
                              "v1:DeletePlanRequest"
                              ][0]["Plans"][0]["PackageAssociation"][0][
                              "PDPNumber"
                              ][0],
                            STATUS: "Deleted",
                          };
                          mglogsArr.push(log);
                          mglogsArr.sort(function (a, b) { return b.PLAN_YEAR - a.PLAN_YEAR });
                        });
                      });
                    }
                    const updateLogData = {
                      MGData: mglogsArr
                    }
                    let updateLog = await updateLogs(db, currMGLog.insertedId, updateLogData);
                  })
                }
              } else {
                const updateLogData = {
                  MGData: mglogsArr
                }
                let updateLog = await updateLogs(db, currMGLog.insertedId, updateLogData)

              }
              if (rx.length > 0) {

                const deleteRXResponse = await deleteRx(rx, gConfig.kafkaHost, gConfig.RxMappingTopicName, gConfig.saslKey, gConfig.saslencpass, env);

                if (deleteRXResponse == null) {
                  const updateLogData = {
                    ExecutionStatus: 'Failed'
                  }
                  let updateLog = await updateLogs(db, currMGLog.insertedId, updateLogData)
                  return callback("Failed");
                } else {
                  Promise.all(deleteRXResponse).then(async (deleteResp) => {
                    for (const dr of deleteResp) {

                      let log = {
                        PLAN_YEAR: dr.RxCodeMapping.PlanYear,
                        PLAN_NUMBER: dr.RxCodeMapping.Plan,
                        OPTION_NUMBER: dr.RxCodeMapping.Option,
                        RX_NUMBER: dr.RxCodeMapping.RxNumber,
                        PDP_NUMBER: dr.RxCodeMapping.PDPNumber,
                        RX_CODE: dr.RxCodeMapping.RxCode,
                        STATUS: "Deleted",


                      }
                      rxlogsArr.push(log)
                      rxlogsArr.sort(function (a, b) { return b.PLAN_YEAR - a.PLAN_YEAR });
                    }
                    const updateLogData = {
                      ExecutionStatus: 'Completed',
                      RXData: rxlogsArr,
                    };
                    let updateLog = await updateLogs(
                      db,
                      currMGLog.insertedId,
                      updateLogData
                    );
                    callback("Success");
                  })
                };
              } else {
                const updateLogData = {
                  ExecutionStatus: 'Completed',
                  RXData: rxlogsArr,
                };
                let updateLog = await updateLogs(
                  db,
                  currMGLog.insertedId,
                  updateLogData
                );
                callback("Success");
              }


            } catch (error) {
              console.log(error);
              const updateLogData = {
                ExecutionStatus: 'Failed'
              };
              let updateLog = await updateLogs(
                db,
                currMGLog.insertedId,
                updateLogData
              );
              callback("Failed");
            }
          }
        });
      });
    }
  });
}

async function getMissingMIPlans(oracleConn, db) {
  console.log('Getting Missing MI Plans')
  const pdhMIPlans = await oracleConn.execute(
    `
      SELECT ehag.PLAN_ID || '-' || ehag.YEAR_DISP plan_id
      FROM apps.ego_hum_ag_medicare__agv ehag,
          mtl_system_items_b           msb,
          ego_catalog_groups_v         egv,
          (  SELECT plan_id, year, COUNT (plan_id)
                FROM apps.ego_hum_ag_medicare__agv
            GROUP BY plan_id, year
              HAVING COUNT (plan_id) > 1) dup_plan
      WHERE     ehag.INVENTORY_ITEM_ID = msb.inventory_item_id
            AND msb.item_catalog_group_id = egv.CATALOG_GROUP_ID
            AND msb.organization_id = ehag.ORGANIZATION_ID
            AND ehag.plan_id = dup_plan.plan_id(+)
            AND ehag.YEAR = dup_plan.year(+)
            AND dup_plan.plan_id IS NULL
            AND dup_plan.year IS NULL
            AND ehag.plan_id IS NOT NULL
      ORDER BY ehag.YEAR DESC
    `,
    []
  )

  const pdhPlanIDs = pdhMIPlans.rows.map(item => {
    return item['PLAN_ID']
  })

  const miCollection = db.collection('mi_products')
  const results = await miCollection.find({ _PlanIdentifier: { $nin: pdhPlanIDs } }).project({ _id: 0, _PlanIdentifier: 1 }).toArray()

  const miResponse = results.map(item => item._PlanIdentifier)
    .filter(itm => itm != null)

  return miResponse
}

async function getMissingMGPlans(oracleConn, db) {
  console.log('Getting Missing MG Plans')
  const pdhMGPlans = await oracleConn.execute(
    `
      select EHGV.PLAN_YEAR, EHGV.PLAN_NUMBER, EHGV.OPTION_NUMBER, EHGV.RX_NUMBER, EHGV.PDP_NUMBER
      from apps.EGO_HUM_MEDICARE_GRP_AGV EHGV,
      apps.EGO_HUM_AG_GRP_ASSOC_AGV EGASO, 
      mtl_system_items_b MSB
      where EHGV.INVENTORY_ITEM_ID = MSB.INVENTORY_ITEM_ID
      AND EHGV.ORGANIZATION_ID = MSB.ORGANIZATION_ID
      AND EHGV.INVENTORY_ITEM_ID = EGASO.INVENTORY_ITEM_ID
      AND EHGV.ORGANIZATION_ID = EGASO.ORGANIZATION_ID
      AND EGASO.PACAKGE_TYPE in ( 'Medical','Pharmacy')
      ORDER BY EHGV.PLAN_YEAR DESC
    `,
    []
  )

  console.log(pdhMGPlans)

  const pdhPlanIDs = pdhMGPlans.rows
  //console.log(pdhPlanIDs)
  const mgCollection = db.collection('mg_products')
  const fields = {
    '_id': 0,
    'Product.PlanHeader.PackageAssociation': 1,
    'Product.PlanHeader.PlanYear': 1
  }

  const results = await mgCollection.find({}).project(fields).toArray()
  console.log(results)

  const mgResponse = results.map(item => {
    return {
      PLAN_YEAR: item.Product.PlanHeader.PlanYear,
      PLAN_NUMBER: item.Product.PlanHeader.PackageAssociation.Plan,
      OPTION_NUMBER: item.Product.PlanHeader.PackageAssociation.Option,
      RX_NUMBER: item.Product.PlanHeader.PackageAssociation.RxNumber,
      PDP_NUMBER: item.Product.PlanHeader.PackageAssociation.PDPNumber,
    }
  })

  let diff = _.differenceWith(mgResponse, pdhPlanIDs, _.isEqual)
  let keys = ['PLAN_YEAR', 'PLAN_NUMBER:', 'OPTION_NUMBER', 'RX_NUMBER', 'PDP_NUMBER'],
    filtered = diff.filter(
      (s => o =>
        (k => !s.has(k) && s.add(k))
          (keys.map(k => o[k]).join('|'))
      )
        (new Set)
    );

  return diff
}


async function getMissingRx(oracleConn, db) {
  console.log('Getting Missing RX')
  const pdhMGPlans = await oracleConn.execute(
    `
    select  distinct m.plan_year,r.rx_code
    from humego.portal_grp_rx_code r, humego.portal_grp_rx_mapping m
    where m.portal_grp_rx_code_id=r.portal_grp_rx_code_id
    order by r.rx_code desc
    `,
    []
  )

  const pdhRx = pdhMGPlans.rows

  const mgCollection = db.collection('mg_rx_mapping')
  const results = await mgCollection.find({}).toArray()

  const rxResponse = results.map(item => {
    return {
      PLAN_YEAR: item.RxCodeMapping.PlanYear,
      RX_CODE: item.RxCodeMapping.RxCode,
    }
  })

  let diff = _.differenceWith(rxResponse, pdhRx, _.isEqual)
  let data = []

  for (let ctr = 0; ctr < diff.length; ctr++) {
    let cur = diff[ctr]
    let index = results.findIndex(i => i.RxCodeMapping.PlanYear == cur.PLAN_YEAR && i.RxCodeMapping.RxCode == cur.RX_CODE)

    if (index) {
      data.push(results[index])
    }
  }

  return data
}

async function deleteMIPlans(miPlans, endpoint) {
  console.log('Deleting MI Plans')
  let promises = []
  try {
    if (miPlans.length > 0) {
      var currentdate = new Date();
      var datetime = String(currentdate.getMonth() + 1).padStart(2, "0") + ""
        + String(currentdate.getDate()).padStart(2, "0") + ""
        + String(currentdate.getFullYear()) + ""
        + String(currentdate.getHours()).padStart(2, "0") + ""
        + String(currentdate.getMinutes()).padStart(2, "0") + ""
        + String(currentdate.getSeconds()).padStart(2, "0") + ""
        + String(currentdate.getMilliseconds()).padStart(3, "0") + "";



      for (let ctr = 0; ctr < miPlans.length; ctr++) {
        const plan = miPlans[ctr]
        console.log(plan)
        const transactionID = 'Delete_' + plan + "_" + datetime
        const request = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:v1="http://schemas.humana.com/Product/ProductServiceHub/DeletePlan/V1">
        <soap:Header>
            <Transaction>${transactionID}</Transaction>
        </soap:Header>
        <soap:Body>
            <v1:DeletePlanRequest>
              <LOB>Medicare Individual</LOB>
              <Plans>
                  <TransactionID>${transactionID}</TransactionID>
                  <PlanID>${plan}</PlanID>
                  
              </Plans>
            </v1:DeletePlanRequest>
        </soap:Body>
      </soap:Envelope>`
        promises.push(await axios.post(endpoint, request, request_options))
      }
      return promises
    }
  } catch {
    return null
  }
}

async function deleteMGPlans(mgPlans, endpoint) {
  console.log('Deleting MG Plans')
  try {
    if (mgPlans.length > 0) {
      var currentdate = new Date();
      var datetime = String(currentdate.getMonth() + 1).padStart(2, "0") + ""
        + String(currentdate.getDate()).padStart(2, "0") + ""
        + String(currentdate.getFullYear()) + ""
        + String(currentdate.getHours()).padStart(2, "0") + ""
        + String(currentdate.getMinutes()).padStart(2, "0") + ""
        + String(currentdate.getSeconds()).padStart(2, "0") + ""
        + String(currentdate.getMilliseconds()).padStart(3, "0") + "";
      let promises = []
      for (let ctr = 0; ctr < mgPlans.length; ctr++) {
        const data = mgPlans[ctr]
        const transactionID = 'Delete_' + data.PLAN_YEAR + "-" + data.PLAN_NUMBER + "-" + data.OPTION_NUMBER + "-" + data.RX_NUMBER + "-" + data.PDP_NUMBER + "_" + datetime
        const request = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:v1="http://schemas.humana.com/Product/ProductServiceHub/DeletePlan/V1">
        <soap:Header>
            <Transaction>${transactionID}</Transaction>
        </soap:Header>
        <soap:Body>
            <v1:DeletePlanRequest>
              <LOB>Medicare Group</LOB>
              <Plans>
                  <TransactionID>${transactionID}</TransactionID>
                  <HPASProductID>ThisIsARequiredFieldWithNoUse</HPASProductID>
                  <PlanID>${data.PLAN_YEAR + "-" + data.PLAN_NUMBER + "-" + data.OPTION_NUMBER + "-" + data.RX_NUMBER + "-" + data.PDP_NUMBER + "-"}</PlanID>
                  <Year>${data.PLAN_YEAR}</Year>
                  <PDHDeletedDate>${datetime}</PDHDeletedDate>
                  <GroupName></GroupName>
                  <PackageAssociation>
                    <Plan>${data.PLAN_NUMBER}</Plan>
                    <Option>${data.OPTION_NUMBER}</Option>
                    <RxNumber>${data.RX_NUMBER}</RxNumber>
                    <PDPNumber>${data.PDP_NUMBER}</PDPNumber>
                  </PackageAssociation>
              </Plans>
          </v1:DeletePlanRequest>
        </soap:Body>
      </soap:Envelope>
      `
        promises.push(await axios.post(endpoint, request, request_options))
      }
      return promises
    }
  } catch {
    return null
  }
}

async function deleteRx(rx, kafka_Host, topicName, saslKey, saslencpass, env) {
  console.log("Deleting RX");

  if (env === 'SIT') {
    env = 'TEST'
  }

  try {
    const decipher = crypto.createDecipher("aes192", saslKey);
    var decrypted = decipher.update(saslencpass, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const kafka = new Kafka({
      brokers: kafka_Host,
      ssl: true,
      sasl: {
        mechanism: "scram-sha-256",
        username: "hpas-psh-svc-user",
        password: decrypted,
      },
    });
    const producer = kafka.producer();

    var currentdate = new Date();
    var datetime = String(currentdate.getMonth() + 1).padStart(2, "0") + ""
      + String(currentdate.getDate()).padStart(2, "0") + ""
      + String(currentdate.getFullYear()) + ""
      + String(currentdate.getHours()).padStart(2, "0") + ""
      + String(currentdate.getMinutes()).padStart(2, "0") + ""
      + String(currentdate.getSeconds()).padStart(2, "0") + ""
      + String(currentdate.getMilliseconds()).padStart(3, "0") + "";

    if (rx.length > 0) {
      let promises = [];
      for (let ctr = 0; ctr < rx.length; ctr++) {
        const data = rx[ctr];
        console.log(data);

        var message = {};
        let processmessage = {};
        try {
          processmessage = await processMessage(message, data);
        } catch (error) {
          console.log(error);
        }

        try {
          const msg = await run(processmessage);
          promises.push(msg);

        } catch (error) {
          console.log(error);
        }

        function processMessage(message, data) {
          return new Promise((resolve, reject) => {
            if (
              data.RxCodeMapping.LastActionTaken == "Update" ||
              data.RxCodeMapping.LastActionTaken == "Insert"
            ) {

              message = {
                _PlanIdentifier: data._PlanIdentifier,
                RxCodeMapping: {
                  PlanYear: data.RxCodeMapping.PlanYear,
                  Plan: data.RxCodeMapping.Plan,
                  Option: data.RxCodeMapping.Option,
                  RxNumber: data.RxCodeMapping.RxNumber,
                  PDPNumber: data.RxCodeMapping.PDPNumber,
                  RxCode: data.RxCodeMapping.RxCode,
                  CoverageCode: data.RxCodeMapping.CoverageCode,
                  Comments: "Delete Request as part of PSHclone",
                  LastActionTaken: "Delete",
                  TransactionID: 'Delete_' + data.RxCodeMapping.PlanYear + "-" + data.RxCodeMapping.Plan + "-" + data.RxCodeMapping.Option + "-" + data.RxCodeMapping.RxNumber + "-" + data.RxCodeMapping.PDPNumber + "-" + data.RxCodeMapping.RxCode + "_" + datetime,
                  LastSyncTime: datetime,
                  HPAS_ENV: env,
                },
              };

            }

            resolve(message);
          });
        }

        //MF07-Rutuja-Start
        async function run(message) {
          return new Promise(async (resolve, reject) => {
            if (
              (message != undefined || message != null) &&
              message.RxCodeMapping != undefined &&
              message.RxCodeMapping.LastActionTaken == "Delete"
            ) {
              console.log("before sending the message", message);
              await producer.connect();
              producer
                .send({
                  topic: topicName,
                  messages: [
                    {
                      value: JSON.stringify(message),
                    },
                  ],

                })
                .then((success) => {
                  console.log(
                    "response from kafka--------------------------------",
                    success
                  );
                  resolve(message);  //mf07
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          });
        };
      }

      return promises;
    }
  } catch {
    return null
  }
}

async function saveLogs(db, data) {
  let collection = db.collection('post_clone_logs')
  return await collection.insertOne(data)
}

async function updateLogs(db, id, data) {
  let collection = db.collection('post_clone_logs')
  return await collection.updateOne({ _id: id }, { $set: data })
}

async function deletePFPKeys(currentDB, envName) {

  if (envName === 'SIT') {
    envName = 'TEST'
  }

  let collection = currentDB.collection('pdf_datas')
  collection.deleteMany({})
  config.loadConfig("PROD", async (gConfig, err) => {
    if (gConfig) {

      mongodb.connect(gConfig, async (dba, mongoDbErr) => {
        if (mongoDbErr) {
          console.error(mongoDbErr)
        } else {

          let prodCollection = dba.collection('pdf_datas')
          const data = await prodCollection.find({}).toArray()
          for (var i = 0; i < data.length; i++) {

            data[i].About.HPAS_ENV = envName;
          }
          return await collection.insertMany(data)
        }
      })
    }
  })
}

async function getMILogs(env, callback) {
  config.loadConfig(env, async (gConfig, err) => {
    if (gConfig) {

      mongodb.connect(gConfig, async (db, mongoDbErr) => {
        if (mongoDbErr) {
          console.error(mongoDbErr)
        } else {

          let collection = db.collection('post_clone_logs')
          const result = await collection.find({ 'LOB': 'Medicare Individual' }).toArray()
          result.sort(function (a, b) { return b.ExecutionTime - a.ExecutionTime });
          callback(result)

        }
      })
    }
  })
}

async function getMGRXLogs(env, callback) {
  config.loadConfig(env, async (gConfig, err) => {
    const decipher = crypto.createDecipher('aes192', gConfig.messageKey );  
    var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');  
    decrypted += decipher.final('utf8');

    var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
    gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
    console.log("generateRxExcelFile::url.....", url);
        MongoClient.connect(url)
        .then(async(db) => {
          var dbHpas = db.db(gConfig.dbName);
          let collection = dbHpas.collection('post_clone_logs')
          const result = await collection.find({ 'LOB': 'Medicare Group' }).toArray()
          result.sort(function (a, b) { return b.ExecutionTime - a.ExecutionTime });
          callback(result)

        })
    
  })
}

module.exports.syncMIPlans = syncMIPlans
module.exports.syncMGPlans = syncMGPlans
module.exports.getMILogs = getMILogs
module.exports.getMGRXLogs = getMGRXLogs
module.exports.deletePFPKeys = deletePFPKeys
