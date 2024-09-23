var MongoClient = require('mongodb').MongoClient;
var Excel = require('exceljs');
var crypto = require('crypto');
const logger = require('../commonConfig/Main/logger.js');
var assert = require('assert');
var benifitsListDataTab = require('../commonConfig/ExcelTabs/benifitsListDataTab');

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

var generateMIBenifitsExcelFile = (planYear, envName, callback) => {

    var currentdate = new Date();
    //var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/' + planYear + '_MedicareIndividualBenefitNames.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Srikanth Lekkala';
    workbook.lastModifiedBy = 'Srikanth Lekkala';
    workbook.created = new Date();

    global.ws1 = workbook.addWorksheet(planYear);
    benifitsListDataTab.configureTab(ws1, styleValues);
    ws1.getRow('1').font = headerFont;
    ws1.autoFilter = 'A1:B1';

    doMongoOperations(envName, planYear, (result, err) => {
        if (result) {
            console.log('commiting test');
            ws1.commit();
            workbook.commit()
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

}

function doMongoOperations(envName, planYear, callback) {

    logger.log.info('start Time is ', new Date());
    //  var arr=[];
    // var promise = new Promise(function (resolve, reject) {
    //var promise=new Promise(
    miConfig.loadConfig(envName, (gConfig, err) => {

        // var url = `mongodb://${gConfig.userId}:${gConfig.pass}@${gConfig.node}:${gConfig.port}/HPASDB?replicaSet=${gConfig.replicaSet}&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary`;

        // logger.log.info('url is ' + url);

        const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
        var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        //var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/HPASDB?replicaSet=" + gConfig.replicaSet + "&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/" +
        //     gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
        //     "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
        gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
        console.log("generateMiBenefitsExcelFile:90:url.....", url);
        
        MongoClient.connect(url)
        .then(async (db) => {
            logger.log.info('Connected to MongoDb Server');
            var dbHpas = db.db(gConfig.dbName);

            var benefitConditions = [
                {
                    type: 'Medical',
                    value: 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit.ServiceName',
                    array: 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit',
                    filter: { 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit.MSBExist': 'N' }
                },
                {
                    type: 'MSB',
                    value: 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit.ServiceName',
                    array: 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit',
                    filter: { 'Product.MedicalPackageList.MedicalPackage.MedicalBenefits.MedicalBenefit.MSBExist': 'Y' }
                },
                {
                    type: 'OSB',
                    value: 'Product.SubPackageList.SubPackage.ServiceDescription',
                    array: 'Product.SubPackageList.SubPackage',
                    filter: { 'Product.SubPackageList.SubPackage.Type': 'OSB' }
                },
                {
                    type: 'Incentive',
                    value: 'Product.SubPackageList.SubPackage.SubPackageName',
                    array: 'Product.SubPackageList.SubPackage',
                    filter: { 'Product.SubPackageList.SubPackage.Type': 'Incentive' }
                },
                {
                    type: 'VAIS',
                    value: 'Product.SubPackageList.SubPackage.SubPackageName',
                    array: 'Product.SubPackageList.SubPackage',
                    filter: { 'Product.SubPackageList.SubPackage.Type': 'VAIS' }
                },
            ]

            var benifitsProcessed = 0;
            benefitConditions.forEach((benefitCondition) => {
                retreiveDataMongo(dbHpas, planYear, benefitCondition, function (result) {
                    benifitsProcessed++;
                    if (result) {
                        if (benifitsProcessed == benefitConditions.length) {
                            callback('success');
                        }
                    }
                });
            });
        });
    });

}
var retreiveDataMongo = async function (db, planYear, benefitCondition, callback) {
    var collection = db.collection('mi_products');
    var results = {};
    results = await collection.aggregate([
        { "$match": { "Product.PlanHeader.PlanYear": parseInt(planYear) } },
        { "$unwind": "$" + benefitCondition.array },
        { "$match": benefitCondition.filter },
        { "$group": { "_id": "$" + benefitCondition.value, "count": { "$sum": 1 } } },
        { "$sort": { "_id": 1 } }
    ])
        .map(function (doc) {
            return doc._id;
        }).toArray();

    var benefitsProcessed = 0;
    //console.log(results);
    //console.log(benefitCondition.type," ",results.length);
    results.forEach((benefitName) => {
        benefitsProcessed++;
        benifitsListDataTab.loadRowData(ws1, benefitCondition.type, benefitName);
        if (benefitsProcessed == results.length) {
            callback('success');
        }
    });
}
var simpleDistinctold = function (db, benefitCondition, callback) {
    console.log('entered distinct');
    var collection = db.collection('mi_products');
    var benefitsProcessed = 0;
    collection.distinct(benefitCondition.value, benefitCondition.filter,

        function (err, result) {
            assert.equal(err, null);
            result.forEach((benefitName) => {
                benefitsProcessed++;
                benifitsListDataTab.loadRowData(ws1, benefitCondition.type, benefitName);

                if (benefitsProcessed === result.length) {
                    console.log('benefitsProcessed for ' + benefitCondition.type + " is " + result.length);
                    callback('success');
                }
            });
        }
    );
}

module.exports.generateMIBenifitsExcelFile = generateMIBenifitsExcelFile;