/*History: Added SPAP Program related tabs on 29/09/2021 Author: KiranKumar Padi (KXP0380)*/
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var Excel = require('exceljs');
const logger = require('../commonConfig/Main/logger.js');


// including individual tabs info 
var planHeaderTab = require('../commonConfig/ExcelTabs/planHeaderTabPdf.js');
var aboutTab = require('../commonConfig/ExcelTabs/aboutTabPdf.js');
var serviceAreaTab = require('../commonConfig/ExcelTabs/serviceAreaTabPdf.js');

//Environment configuration will be happened inside /config/loadConfig.js
const miConfig = require('../commonConfig/config/loadConfig.js');

var styleValues = ({
    font: {
        color: 'Black',
        size: 12,
        name: 'Times New Roman'
    },
    numberFormat: '$#,##0.00; ($#,##0.00); -'
});

var headerFont = {
    name: 'Times New Roman',
    family: 4,
    size: 14,
    color: { argb: '004e47cc' },
    underline: false,
    bold: true
};

// var workbook;// = new Excel.stream.xlsx.WorkbookWriter(options);

var generateMIExcelFile =  (planYear, envName, tabsRequired, callback) => {

    //console.log("in generateMIExcelFile");
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MI_PSH_PDF_Export_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Reshma';
    workbook.lastModifiedBy = 'Reshma';
    workbook.created = new Date();


    if (tabsRequired.planHeaderDetails == true) {
        global.ws1 = workbook.addWorksheet('PDF Header');
        planHeaderTab.configureTab(ws1, styleValues);
        ws1.getRow('1').font = headerFont;
        ws1.autoFilter = 'A1:J1';
    }
    if (tabsRequired.serviceArea == true) {
        global.ws50 = workbook.addWorksheet('Service Area');
        serviceAreaTab.configureTab(ws50, styleValues);
        ws50.getRow('1').font = headerFont;
        ws50.autoFilter = 'A1:E1';
    }
    
    if (tabsRequired.aboutDetails == true) {
        global.ws41 = workbook.addWorksheet('About');
        aboutTab.configureTab(ws41, styleValues);
        ws41.getRow('1').font = headerFont;
        ws41.autoFilter = 'A1:F1';
    }

    var filter = {
        'PlanYear': parseInt(planYear)
    };

       doMIMongoOperations(envName, planYear, tabsRequired,  async (result, err) => {
        if (result) {
            console.log('commiting test');
            console.log(result);
            var book = await workbook.commit()
                .then(() => {
                    logger.log.info('file creation completed !!');
                    callback(generatedFileName);
                }).catch((err) => {
                    logger.log.error('error caught while writing to excell file is ', err);
                    callback(undefined, err);
                });

        }
        else {
            callback(undefined, err);
        }
    });
};
 function doMIMongoOperations(envName, planYear, tabsRequired, callback) {
    logger.log.info('start Time is ', new Date());
    
    miConfig.loadConfig(envName, (gConfig, err) => {
        if (gConfig) {
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            // gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
            // "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&readPreference=primary";
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIExcelFile:340:url.....", url);
            logger.log.info('url is ' + url);

            MongoClient.connect(url)
                .then(async (db) => {
                    console.log('successfully...')
                    logger.log.info('Connected to MongoDb MI Server');

                    var dbHpas = db.db(gConfig.dbName);
                    var filter = {};

                    
                    
                    filter['PlanYear'] = parseInt(planYear);
                    var plansProcessed = 0;
                    var totalPlans = 0;
                    const options = { PlanID: 1 };
                    var plansData = await dbHpas.collection("pdf_datas").countDocuments({"PlanYear":planYear,"CoverageType":"MI"})
                    totalPlans = plansData;
                    console.log('totalPlans inside', plansData);


                    // var promiseCus = new Promise(async function (resolve, reject) {
                    //     const customAtt = await dbHpas.collection("mi_products_custom_attrs").find().toArray()

                    //     resolve(customAtt);
                    // });

                    
                        var promisePlan = new Promise(async function (resolve, reject) {
                            const products = await dbHpas.collection("pdf_datas").find({"PlanYear":planYear,"CoverageType":"MI"}).sort({ "PlanID": 1 }).toArray()
                            console.log(products);
                            resolve(products);

                        });


                        promisePlan.then((plans) => {
                            for (const product of plans) {
                                var tags = [];

                                generatePdfMIExcellStull(tabsRequired, product, tags, envName);
                                console.log('plan processed', product.PlanID);
                                plansProcessed++;
                                if (plansProcessed === totalPlans) {
                                    console.log('final finish');
                                    callback('success');
                                }

                            }

                        })
                    

                });
        }
        else {
            logger.log.error('error occured is ' + err);
        }
    });
 }
//  function generateMICustomAttributes(dbHpas) {
//     var promise = new Promise(function (resolve, reject) {
//         dbHpas.collection("mi_products_custom_attrs", function (err, result) {
//             if (err) {
//                 console.log('error occured', err);
//                 resolve([]);
//             }
//             if (result) {
//                 console.log('result avaialbel is ', result);
//                 resolve(JSON.stringify(result.Tags));

//             } else {
//                 console.log('result not avaialbel is ', result);
//                 resolve([]);
//             }
//         });
//     });
// }

// function generateMIPlan(dbHpas,filter) {
    
//     return new Promise(function (resolve, reject) {
//         dbHpas.collection("mi_products").find(filter, function (err, result) {
//             if (err) {
//                 console.log('error occured', err);
//                 //resolve([]);
//             }
//             if (result) {
//                 console.log('result avaialble is ', result);
//                 //resolve(JSON.stringify(result.Tags));

//             } else {
//                 console.log('result not avaialble is ', result);
//                 //resolve([]);
//             }
//         });
//     });
// }

// async function getData(dbHpas,filter){
//     planAttr=await generateMIPlan(dbHpas.filter);
//     customAttr= await generateMICustomAttributes(dbHpas);
//    return {
//        plans: planAttr,
//        customA:customAttr
//    }
// }
function generatePdfMIExcellStull(tabsRequired, MIPlan, tags, envName) {
        console.log(MIPlan)
        //console.log(tabsRequired)
        //console.log(tags)
        //MIPlan = JSON.stringify(MIPlan)
    if (tabsRequired.planHeaderDetails == true) {
        if (MIPlan.InternalFormNumber != undefined && MIPlan.InternalFormNumber != null) {
            planHeaderTab.loadRowData(ws1, MIPlan, MIPlan.About, "Yes");
        } else {
            planHeaderTab.loadRowData(ws1,MIPlan, MIPlan.About, "No");
        }

    }
    if (tabsRequired.serviceArea == true) {
        if (MIPlan.ServiceAreaList != undefined && MIPlan.ServiceAreaList != null) {
            serviceAreaTab.loadRowData(ws50,MIPlan,MIPlan.ServiceAreaList);
        } 

    }
    
    if (tabsRequired.aboutDetails == true) {
        if(MIPlan.About != undefined && MIPlan.About != null ){
            aboutTab.loadRowData(ws41, MIPlan);
        }
    }
}

var generateMGExcelFile =  (planYear, envName, tabsRequired, callback) => {

    //console.log("in generateMIExcelFile");
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MG_PSH_PDF_Export_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Reshma';
    workbook.lastModifiedBy = 'Reshma';
    workbook.created = new Date();


    if (tabsRequired.planHeaderDetails == true) {
        global.ws1 = workbook.addWorksheet('PDF Header');
        planHeaderTab.configureTab(ws1, styleValues);
        ws1.getRow('1').font = headerFont;
        ws1.autoFilter = 'A1:J1';
    }
    if (tabsRequired.serviceArea == true) {
        global.ws50 = workbook.addWorksheet('Service Area');
        serviceAreaTab.configureTab(ws50, styleValues);
        ws50.getRow('1').font = headerFont;
        ws50.autoFilter = 'A1:E1';
    }
    
    if (tabsRequired.aboutDetails == true) {
        global.ws41 = workbook.addWorksheet('About');
        aboutTab.configureTab(ws41, styleValues);
        ws41.getRow('1').font = headerFont;
        ws41.autoFilter = 'A1:F1';
    }

    var filter = {
        'PlanYear': parseInt(planYear)
    };

       doMGMongoOperations(envName, planYear, tabsRequired,  async (result, err) => {
        if (result) {
            console.log('commiting test');
            console.log(result);
            var book = await workbook.commit()
                .then(() => {
                    logger.log.info('file creation completed !!');
                    callback(generatedFileName);
                }).catch((err) => {
                    logger.log.error('error caught while writing to excell file is ', err);
                    callback(undefined, err);
                });

        }
        else {
            callback(undefined, err);
        }
    });
};

function doMGMongoOperations(envName, planYear, tabsRequired, callback) {
    logger.log.info('start Time is ', new Date());
    
    miConfig.loadConfig(envName, (gConfig, err) => {
        if (gConfig) {
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            // gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
            // "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&readPreference=primary";
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIExcelFile:340:url.....", url);
            logger.log.info('url is ' + url);

            MongoClient.connect(url)
                .then(async (db) => {
                    console.log('successfully...')
                    logger.log.info('Connected to MongoDb MI Server');

                    var dbHpas = db.db(gConfig.dbName);
                    var filter = {};

                    
                    
                    filter['PlanYear'] = parseInt(planYear);
                    var plansProcessed = 0;
                    var totalPlans = 0;
                    const options = { PlanID: 1 };
                    var plansData = await dbHpas.collection("pdf_datas").countDocuments({"PlanYear":planYear,"CoverageType":"MG"})
                    totalPlans = plansData;
                    console.log('totalPlans inside', plansData);


                    // var promiseCus = new Promise(async function (resolve, reject) {
                    //     const customAtt = await dbHpas.collection("mi_products_custom_attrs").find().toArray()

                    //     resolve(customAtt);
                    // });

                    
                        var promisePlan = new Promise(async function (resolve, reject) {
                            const products = await dbHpas.collection("pdf_datas").find({"PlanYear":planYear,"CoverageType":"MG"}).sort({ "PlanID": 1 }).toArray()
                            console.log(products);
                            resolve(products);

                        });


                        promisePlan.then((plans) => {
                            for (const product of plans) {
                                var tags = [];

                                generatePdfMGExcellStull(tabsRequired, product, tags, envName);
                                console.log('plan processed', product.PlanID);
                                plansProcessed++;
                                if (plansProcessed === totalPlans) {
                                    console.log('final finish');
                                    callback('success');
                                }

                            }

                        })
                    

                });
        }
        else {
            logger.log.error('error occured is ' + err);
        }
    });
 }
 function generatePdfMGExcellStull(tabsRequired, MIPlan, tags, envName) {
    console.log(MIPlan)
    //console.log(tabsRequired)
    //console.log(tags)
    //MIPlan = JSON.stringify(MIPlan)
if (tabsRequired.planHeaderDetails == true) {
    if (MIPlan.InternalFormNumber != undefined && MIPlan.InternalFormNumber != null) {
        planHeaderTab.loadRowData(ws1, MIPlan, MIPlan.About, "Yes");
    } else {
        planHeaderTab.loadRowData(ws1,MIPlan, MIPlan.About, "No");
    }

}
if (tabsRequired.serviceArea == true) {
    if (MIPlan.ServiceAreaList != undefined && MIPlan.ServiceAreaList != null) {
        serviceAreaTab.loadRowData(ws50,MIPlan,MIPlan.ServiceAreaList);
    } 

}

if (tabsRequired.aboutDetails == true) {
    if(MIPlan.About != undefined && MIPlan.About != null ){
        aboutTab.loadRowData(ws41, MIPlan);
    }
}
}

module.exports.generateMIExcelFile = generateMIExcelFile;
module.exports.generateMGExcelFile = generateMGExcelFile;