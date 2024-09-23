var Excel = require('exceljs');
const mongoose = require('mongoose');

//var config = require("./config/loadConfig.js");
var miConfig = require('../commonConfig/config/loadConfig.js');

const customAttributesSchema = new mongoose.Schema(
    {
        PlanID: {
            type: 'String'
        },
        Tags: [{
            type: 'String'
        }]
    }
);
const CustomAttributes = mongoose.model('mi_products_custom_attrs', customAttributesSchema);

var loadCustomAttributes = (envName, fileName, callback) => {

    //var url = "mongodb://localhost:27017/MyDb";
    miConfig.loadConfig(envName, (config) => {       //change done here 
        console.log('config ', config);
        // var url = "mongodb://"+ config.userId + ":" +config.pass + "@" + config.node + ":" + config.port + "/HPASDB?replicaSet=" + config.replicaSet+ "&authMechanism=PLAIN&maxPoolSize=1&ssl=true&slaveOk=false&auto_reconnect=true&readPreference=primary";
        var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
        gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
        console.log("parseExcelFile:25:url.....", url);
        mongoose.connect(url, { useNewUrlParser: true })
            .then(() => {
                console.log('Yaaayyyy!!! connected to MongoDB HPASDB.' + config.node);



                var workbook = new Excel.Workbook();
                workbook.xlsx.readFile('\\\\LOUAPPWDS183\\HPASFiles\\Mongo\\Tags_Ben\\' + fileName + '.xlsx')
                    .then(function () {
                        var worksheet = workbook.getWorksheet(1);
                        var row = worksheet.getRow(1);
                        var col3 = row.getCell(3).value;
                        var col4 = row.getCell(4).value;
                        var col5 = row.getCell(5).value;
                        var promiseDelCollection = new Promise(function (resolve, reject) {
                            CustomAttributes.deleteMany({}, function (err) {
                                if (err) {
                                    console.log('error occured ', err);
                                    reject(err);
                                }
                                console.log('collection removed');
                                resolve();
                            })
                        });
                        var lastRow = worksheet.lastRow;

                        promiseDelCollection.then(() => {
                            var promiseloadRows = new Promise(function (resolve, reject) {
                                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                                    var planId = row.getCell(1).value;
                                    var attrName = row.getCell(2).value;
                                    var tags = [];
                                    tags.push(attrName.trim());
                                    if (row.getCell(1).value != "PlanID") {
                                        if (row.getCell(3).value.toUpperCase() == "Y") {
                                            tags.push(col3);
                                        }
                                        if (row.getCell(4).value.toUpperCase() == "Y") {
                                            tags.push(col4);
                                        }
                                        if (row.getCell(5).value.toUpperCase() == "Y") {
                                            tags.push(col5);
                                        }

                                        var customAttributes = new CustomAttributes(
                                            {
                                                PlanID: planId,
                                                Tags: tags
                                            }
                                        );
                                        customAttributes.save(function (err, customAttributesDoc) {
                                            if (err) {
                                                reject(err);
                                                return console.error(err);
                                            }
                                            //   console.log('saved for ',customAttributesDoc.PlanID);
                                            if (lastRow == row) {
                                                resolve();
                                            }
                                        });

                                    }
                                });
                            });

                            promiseloadRows
                                .then(() => {
                                    console.log('custom attributes loaded successfully');
                                    mongoose.connection.close();
                                    callback('success');
                                })
                                .catch((error) => {
                                    console.log('customattributes load failed ', error);
                                    mongoose.connection.close();
                                    callback('failure', error);
                                });
                        })
                            .catch((error) => {
                                console.log('deltion of existing custom attributes failed');
                                mongoose.connection.close();
                                callback('failure', error);
                            });

                    })
                    .catch((error) => {
                        console.error('error occured is ', error);
                        mongoose.connection.close();
                        callback('failure', error);
                    });

            });
    });
}

module.exports.loadCustomAttributes = loadCustomAttributes;