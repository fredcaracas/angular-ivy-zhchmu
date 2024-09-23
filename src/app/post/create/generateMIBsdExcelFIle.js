var MongoClient = require('mongodb').MongoClient;
var Excel = require('exceljs');
var crypto = require('crypto');
const logger = require('../commonConfig/Main/logger.js');

var benifitSummariesDataTab = require('../commonConfig/ExcelTabs/benifitSummaryDataTab');

const miConfig = require('../commonConfig/config/loadConfig.js');
const mongodb = require('../commonConfig/db/mongodb.js');

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
    size: 12,
    color: { argb: '004e47cc' },
    underline: false,
    bold: true
};

var generateMIBsdExcelFile = (planYear, envName, callback) => {

    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    //Comment out if you are in Local workspace
//    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/Mongo_BSD_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    //Comment out if you are in Windows server
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/Mongo_BSD_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Srikanth Lekkala';
    workbook.lastModifiedBy = 'Srikanth Lekkala';
    workbook.created = new Date();

    global.ws1 = workbook.addWorksheet('Benefit Summary Details');
    benifitSummariesDataTab.configureTab(ws1, styleValues);
    ws1.getRow('1').font = headerFont;
    ws1.autoFilter = 'A1:G1';

    // doMongoOperations(envName, planYear, (result, err) => {
    //     if (result) {
    //         console.log('commiting test');
    //         ws1.commit();
    //         workbook.commit()
    //             .then(() => {
    //                 logger.log.info('file creation completed !!');
    //                 callback(generatedFileName);
    //             }).catch((err) => {
    //                 logger.log.error('error caught while writing to excell file is ', err);
    //                 callback(undefined, err);
    //             });

    //     }
    //     else {
    //         callback(undefined, err);
    //     }
    // });

}

function doMongoOperations(envName, planYear, callback) {

    logger.log.info('start Time is ', new Date());

    miConfig.loadConfig(envName, (gConfig, err) => {

        const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
        var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/HPASDB?replicaSet=" + gConfig.replicaSet + "&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/" +
        //     gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
        //     "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
        gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
        console.log("generateMIBsdExcelFile:88:url.....", url);

        MongoClient.connect(url)
            .then(async (db) => {
            logger.log.info('Connected to MI BSD MongoDb Server');
            //console.log('Connected to MongoDb Server');
            var dbHpas = db.db(gConfig.dbName);

            var filter = {
                'BenefitSummaries.PlanYear': parseInt(planYear)
            };

            dbHpas.collection("ben_summ_datas").find(filter).forEach(function (BenefitSummary) {

                benifitSummariesDataTab.loadRowData(ws1, BenefitSummary.BenefitSummaries);
            }).then(() => {
                callback('success');
            }).catch((err) => {
                console.log('error ', err);
                logger.log.error('error caught while retriving data from db is ', err);
                callback(undefined, err);
            });
        });

    });
}

var retreivePlanYears = (envName, callback) => {
    miConfig.loadConfig(envName, (gConfig, err) => {
        console.log("environment name....", envName);
        if (gConfig) {
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
           
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIBsdExcelFile:649:url.....", url);
           
            MongoClient.connect(url)
            .then(async (db) => {
                logger.log.info('Successfully connected to MongoDb MI Server');
                var dbHpas = db.db(gConfig.dbName);
              
                var planYearData= await dbHpas.collection("myhumana-benefits").distinct('BenefitSummaryResponse.PlanYear', {}, function (error, result) {
                       callback(planYearData);
               
            });
            logger.log.info("planYearData called...")

        })
    }
        else {
            callback(err);
        }
    });
}


module.exports.generateMIBsdExcelFile = generateMIBsdExcelFile;
module.exports.retreivePlanYears = retreivePlanYears;