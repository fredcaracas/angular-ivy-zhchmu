var MongoClient = require('mongodb').MongoClient;
var Excel = require('exceljs');
const logger = require('../commonConfig/Main/logger.js');
var moment = require('moment-timezone');
var crypto = require('crypto');
var planIdsListTab = require('../commonConfig/ExcelTabs/planIdsListTab');

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

var generateMINotUpdatePlansExcelFile = (planYear, envName, diffHours, callback) => {

    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MI_NotUpdated_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Srikanth Lekkala';
    workbook.lastModifiedBy = 'Srikanth Lekkala';
    workbook.created = new Date();

    global.ws1 = workbook.addWorksheet('No Updadted NI Plans List');
    planIdsListTab.configureTab(ws1, styleValues);
    ws1.getRow('1').font = headerFont;
    ws1.autoFilter = 'A1:B1';

    doMongoOperations(envName, planYear, diffHours, (result, err) => {
        if (result) {
            console.log('commiting test');
            ws1.commit();
            workbook.commit()
                .then(() => {
                    logger.log.info('MI file creation completed !!');
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

}

function doMongoOperations(envName, planYear, diffHours, callback) {

    var myTimezone = "America/Panama";
    var myDatetimeFormat = "YYYY-MM-DD hh:mm:ss a z";

    logger.log.info('start Time is ', new Date());

    miConfig.loadConfig(envName, (gConfig, err) => {

        //  var url = `mongodb://${gConfig.userId}:${gConfig.pass}@${gConfig.node}:${gConfig.port}/HPASDB?replicaSet=${gConfig.replicaSet}&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary`;
        const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
        var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        //var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/HPASDB?replicaSet=" + gConfig.replicaSet + "&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/" +
        //     gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
        //     "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        // logger.log.info('url is ' + url);
        var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
        gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
        console.log("generateMINotUpdatedPlans:89:url.....", url);

        MongoClient.connect(url)
            .then(async (db) => {
                logger.log.info('Connected to MongoDb NUP MI Server');
                console.log('Connected to MongoDb Server');
                var dbHpas = db.db(gConfig.dbName);

                //var startTime = moment().tz('America/New_York').startOf('day').toDate();
                var startTime = moment().tz('America/New_York').subtract(parseInt(diffHours), 'hours').toDate();
                console.log('starttime is ' + startTime);
                var filter = {
                    $and: [{ 'Product.PlanHeader.PlanYear': parseInt(planYear) }, { 'Product.About.LastSyncedTime': { $lte: startTime } }]
                };

                dbHpas.collection("mi_products").find(filter).forEach(function (MIPlan) {

                    // plansArray.push(MIPlan.Product.PlanHeader.PlanID);
                    // lastSyncedTimeArray.push( moment(MIPlan.Product.About.LastSyncedTime).tz(myTimezone).format(myDatetimeFormat));
                    planIdsListTab.loadRowData(ws1, MIPlan.Product.PlanHeader.PlanID, moment(MIPlan.Product.About.LastSyncedTime).tz(myTimezone).format(myDatetimeFormat));
                }).then(() => {
                    //  callback(plansArray,lastSyncedTimeArray);
                    callback('success');
                }).catch((err) => {
                    console.log('error ', err);
                    logger.log.error('error caught while retriving data from db is ', err);
                    callback(undefined, err);
                });
            
        });
        // MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        //     if (err) {
        //         console.log('unable to connect to mongoDb' + err);
        //         return logger.log.error('unable to connect to mongoDb' + err);
        //     }
        //     logger.log.info('Connected to MongoDb Server');
        //     console.log('Connected to MongoDb Server');
        //     var dbHpas = db.db("HPASDB");

        //     var filter = {
        //         'BenefitSummaries.PlanYear': parseInt(planYear)
        //     };

        //     dbHpas.collection("ben_summ_datas").find(filter).forEach(function (BenefitSummary) {

        //         benifitSummariesDataTab.loadRowData(ws1, BenefitSummary.BenefitSummaries);
        //         // generateExcellStull(BenefitSummary.BenefitSummaries);
        //     }).then(() => {
        //         callback('success');
        //     }).catch((err) => {
        //         console.log('error ', err);
        //         logger.log.error('error caught while retriving data from db is ', err);
        //         callback(undefined, err);
        //     });
        // });

    });
}

module.exports.generateMINotUpdatePlansExcelFile = generateMINotUpdatePlansExcelFile;