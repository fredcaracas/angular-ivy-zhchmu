var MongoClient = require('mongodb').MongoClient;
const mongodb = require('../commonConfig/db/mongodb.js');
var crypto = require('crypto');
var Excel = require('exceljs');
const logger = require('../commonConfig/Main/logger.js');
const config = require('../commonConfig/config/loadConfig.js');

var miCleanUpDataTab = require('../commonConfig/ExcelTabs/miCleanUpDataTab');



//Environment configuration will be happened inside /config/loadConfig.js

//console.log("Url for DB" + url);

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
    color: 'Black',
    underline: false,
    bold: true
};
// var workbook;// = new Excel.stream.xlsx.WorkbookWriter(options);



var generateExcelFile = async (envName, id, callback) => {

    const currentdate = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hourCycle: 'h23' });
    var datetime = currentdate.split("/").join("_")
    datetime = datetime.replace(',', '_');
    datetime = datetime.split(":").join("_")
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MedicareIndividual_Clean_Up_' + envName + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Fred Caracas';
    workbook.lastModifiedBy = 'Fred Caracas';
    workbook.created = new Date();

    global.ws1 = workbook.addWorksheet('MI Plans');
    miCleanUpDataTab.configureTab(ws1, headerFont);
    ws1.getRow('1').font = headerFont;
    ws1.autoFilter = 'B1:C1';

    doMongoOperations(envName, id, (result, err) => {
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

function doMongoOperations(envName, id, callback) {

    config.loadConfig(envName, async (gConfig, err) => {
        if (gConfig) {

            var plansArray = [];
            var plansData = {};

            mongodb.connect(gConfig, async (db, mongoDbErr) => {
                if (mongoDbErr) {
                    console.error(mongoDbErr)
                } else {

                    let collection = db.collection('post_clone_logs')
                    const result = await collection.find({ 'LOB': 'Medicare Individual' }).toArray()

                    for (var i = 0; i < result.length; i++) {
                        if (id == result[i]._id) {
                            plansArray = result[i].Data;
                        }
                    }
                    console.log(plansArray)
                    miCleanUpDataTab.loadRowData(ws1, plansArray);
                    callback('success');

                }
            })
        }
    })

}

module.exports.generateExcelFile = generateExcelFile;
module.exports.doMongoOperations = doMongoOperations;
