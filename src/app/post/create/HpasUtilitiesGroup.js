/*
Starting file  for hpas utilities web Page
Exports : configureTab, loadRowData
Initial Commit Date : 04/10/2019
Author: Srikanth Lekkala (SYL8051)

For any changes in the file, document below for tracking in the future
*/
const express = require('express');
var bodyParser = require('body-parser')
var timeout = require('connect-timeout');
const path = require('path');
const os = require('os');
const cluster = require('cluster');
const oracledb = require('../db/oracledb.js');
var moment = require('moment-timezone');
const cron = require('node-cron');

const app = express();
const numCPUs = os.cpus();

const generateJson = require('../../MedicareGroup/generateJson.js')
const generateFile = require('../../MedicareGroup/generateExcellFile.js');
const generateMIFile = require('../../MedicareIndividual/generateMIExcellFile.js');
const generatePdfFile = require('../../MedicareIndividual/generatePdfExcellFile');
const generateRxFile = require('../../MedicareGroup/generateRxExcelFIle.js');
const generateMIBsdFile = require('../../MedicareIndividual/generateMIBsdExcelFile.js');
const generateMIBenefitsFile = require('../../MedicareIndividual/generateMIBeniftsExcellFile.js');
const generateBenefitsFile = require('../../MedicareIndividual/generateBeniftsExcellFile.js');
const generateSearchLogsExcelFIle = require('../../MedicareGroup/generateSearchLogsExcelFIle.js');
const generateMINotUpdatedPlans = require('../../MedicareIndividual/generateMINotUpdatedPlans.js');
const generateNotUpdatedPlans=require('../../MedicareGroup/generateNotUpdatedPlans.js');
const generateServiceAreaFile = require('../../MedicareGroup/generateServiceAreaExcelFile.js');
const rxCodeMapping = require('../../MedicareGroup/rxCodeMapping.js');
const generateMiMgEvents = require('./generateMiMgEvents.js')
const resyncPlanIds = require('../../MedicareIndividual/resyncMIPlanIds.js');
const rxCodeExport = require('../../MedicareGroup/rxCodeExport.js')
const mimgExport = require('./mimgExport.js')
//const parseMIExcelFile = require('./parseMIExcelFile');
const parseExcelFile = require('../../MedicareIndividual/parseExcelFile.js');
const checkKnownServers = require('./checkKnownServers');
const syncPlans = require('./syncPlans.js');
const generateMICleanExcel = require('../../MedicareIndividual/generateMICleanUpExcellFile.js');
const generateMGCleanExcel = require('../../MedicareGroup/generateMGCleanUpExcellFile.js');
const miCleanUpEmail = require('../../MedicareIndividual/miCleanUpEmail.js');
const mgCleanUpEmail = require('../../MedicareGroup/mgCleanUpEmail.js');
const generateMedicaidFile = require('../../commonconfig/ExcelTabs/Medicaid/generateMedicaidExcellFile.js');
const generateKafkaFile = require('./generateKafkaExcelFile.js');

const logger = require('./logger.js');

process.title = 'mongoExport';

/* static files (/html) exposure to server */
app.use(express.static('html'));

/* To handle cross origin resource sharing(CORS) requests*/
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/*Logger Request configuration*/
app.use((req, res, next) => {
    var log = logger.log.child({
        id: req.id,
        body: req.body
    }, true)
    log.info({
        req: req
    })
    next();
});

/*Logger Response configuration*/
app.use(function (req, res, next) {
    function afterResponse() {
        res.removeListener('finish', afterResponse);
        res.removeListener('close', afterResponse);
        var log = logger.log.child({
            id: req.id
        }, true)
        log.info({ res: res }, 'response');
    }

    res.on('finish', afterResponse);
    res.on('close', afterResponse);
    next();
});

/*bodyParser configuration*/
//app.use(bodyParser.json());

oracledb.oracleClient();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

/*
 * To send mongoExport.html on the resource /mongoexport
*/
// app.get('/mongoexportGroup', function (req, res) {
//     res.sendFile(path.join(__dirname + '/html/hpasUtilitiesGroup.html'));
// });

app.get('/mongoexport', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/hpasUtilitiesGroup.html'));
});

app.get('/miplanids', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadMIPlanIds.html'));
});

app.get('/miresyncplanids', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadMIReSyncPlanIds.html'));
});

//FR446.2
app.get('/miplanidsKafka', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadKafkaPlanIds.html'));
});

app.get('/medicaidPlanids', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadMedicaidPlanIds.html'));
});

app.get('/mgplanids', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadPlanIds.html'));
});

//FR446.2
app.get('/mgplanidsKafka', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadMGPlanIdKafka.html'));
});

app.get('/mgresyncplanids', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/loadMGReSyncPlanIds.html'));
});

/*
 * To send serverTest.html on the resource /mongoexport
*/
app.get('/serverTest', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/serverTest.html'));
});
/*
 * To send hpasUtilities.html on the request with resource /mongoexportnew
*/
app.get('/mongoexportnew', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/hpasUtilities.html'));
});

/*
 * To send unique plan Years for the specific environment when requested with resource /hpasutilities/exportmongodata/planyears
 * Request :
 *          --> Parameters: envName
 * Response :
 *          --> success : array of years sorted in reverse order for the environment requested with status 200
 *          --> failure : empty array with status 500
 */
app.get('/hpasutilitiesGroup/exportmongodata/planyears', (req, res) => {
     var envName = req.query.envName;
     console.log('envName is ' + envName);
     generateFile.retreivePlanYears(envName, (years, error) => {
         if (years) {
             logger.logResponse(req.id, years, 200);
             res.status(200).send(years.sort().reverse());
         }
         else {
             console.log('error occured', error);
             logger.logErrorResponse(req.id, error, 500);
             res.status(500).send([]);
         }
     })
 });
// planyear 12042020 start

app.get('/hpasutilitiesGroup/exportmongodata/servicearea/planyears', (req, res) => {
    var envName = req.query.envName;
    generateServiceAreaFile.retreivePlanYears(envName, (years, error) => {
        if (years) {
            console.log('year ni paul:' + years);
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});
 app.get('/hpasutilitiesGroup/exportmongodata/rxmapping/planyears', (req, res) => {
    var envName = req.query.envName;
    generateRxFile.retreivePlanYears(envName, (years, error) => {
        if (years) {
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});
// planyear 12042020 start

/*
 * To generate the Product data of selected plans for the specific environment when requested with resource /hpasutilities/exportmongodata/generate
 * Request :
 *          --> Parameters: planYear, envName
 *          --> Body : selected tab's, selected PlanID's
 * Response :
 *          --> success : Generated Excell file with selected plans & tabs with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 600000ms = 600sec = 10min
 */
app.post('/hpasutilitiesGroup/exportmongodata/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    console.log('body ', JSON.stringify(req.body));
    var tabsRequired = JSON.parse(req.body.checkedTabs);
    var planIDs = JSON.parse(req.body.planIds);
    logger.log.info(tabsRequired, 'tabsSelected');
    logger.log.info(planIDs, 'planIds');

    var startTime = new Date();
    generateFile.generateExcelFile(planYear, envName, tabsRequired, planIDs, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

//FR446.2 - Anuja
app.post('/hpasutilities/exportmongodata/generateKafkaMessage', timeout(600000), haltOnTimedout, (req, res) => {
    let planYear = req.query.planYear;
    let envName = req.query.envName;
    let kafkaTopic = req.query.kafkaTopic;
    let lov = req.query.lov;
    let planIDs = req.body;
    generateKafkaFile.generateExcelFromSyncData(planYear, envName, kafkaTopic, planIDs, lov, (err, result) => {
        if (result) {
            console.log('generated File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            let errResponse = {};
            if (err instanceof Error) {
                errResponse.msg = 'Internal Server Error';
            } else {
                errResponse = err;
            }
            res.status(500).json(errResponse);
        }
    });
});

app.get('/hpasutilities/exportmongodata/syncKafkaMessage', timeout(600000), haltOnTimedout, (req, res) => {
    let envName = req.query.envName;
    let kafkaTopic = req.query.kafkaTopic;
    let startTime = new Date();
    generateKafkaFile.syncKafkaMessages(envName, kafkaTopic, (err, result) => {
        if (result) {
            res.status(200).json(result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            let errResponse = {};
            if (err instanceof Error) {
                errResponse.msg = 'Internal Server Error';
            } else {
                errResponse = err;
            }
            res.status(500).json(errResponse);
        }
        let endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilitiesGroup/exportmongodata/generatejson', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    console.log('body ', JSON.stringify(req.body));
    var planIDs = JSON.parse(req.body.planIds);
    logger.log.info(planIDs, 'planIds');
    var startTime = new Date();

    generateJson.generateFile(planYear, envName, planIDs, (result, err) => {
        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });

});
app.post('/hpasutilitiesGroup/exportmongodata/generatepdfMi', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    console.log('body ', JSON.stringify(req.body));
    var tabsRequired = JSON.parse(req.body.checkedTabs);
    //var planIDs = JSON.parse(req.body.planIds);
    logger.log.info(tabsRequired, 'tabsSelected');
    //logger.log.info(planIDs, 'planIds');

    var startTime = new Date();
    generatePdfFile.generateMIExcelFile(planYear, envName, tabsRequired, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilitiesGroup/exportmongodata/generatepdfMg', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    console.log('body ', JSON.stringify(req.body));
    var tabsRequired = JSON.parse(req.body.checkedTabs);
    //var planIDs = JSON.parse(req.body.planIds);
    logger.log.info(tabsRequired, 'tabsSelected');
    //logger.log.info(planIDs, 'planIds');

    var startTime = new Date();
    generatePdfFile.generateMGExcelFile(planYear, envName, tabsRequired, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

/*
 * To generate the Benefit Summary Data for the specific environment & Plan Year when requested with resource /hpasutilities/exportbenifitsummarydata/generate
 * Request :
 *          --> Parameters: planYear, envName
 * Response :
 *          --> success : Generated Excell file with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 600000ms = 600sec = 10min
 */
app.post('/hpasutilitiesGroup/exportrxmapingdata/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;

    var startTime = new Date();
    generateRxFile.generateRxExcelFile(planYear, envName, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

/////generate service area data for medicare group//////////
app.post('/hpasutilitiesGroup/exportservicedata/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;

    var startTime = new Date();
    generateServiceAreaFile.generateServiceAreaFile(planYear, envName, (result, err) => {
       
        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

/*
 * To generate the Not Updated Plans for the specific environment & Plan Year when requested with resource /hpasutilities/exportnotupdatedplans/generate
 * Request :
 *          --> Parameters: planYear, envName
 * Response :
 *          --> success : Generated Excell file with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 600000ms = 600sec = 10min
 */
app.post('/hpasutilitiesGroup/exportnotupdatedplans/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    var diffHours=req.query.diffHours;
    var startTime = new Date();
    console.log('diffHours is ',diffHours);
    generateNotUpdatedPlans.generateNotUpdatePlansExcelFile(planYear, envName, diffHours, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});



/*
 * To generate the Benefit Summary Data for the specific environment & Plan Year when requested with resource /hpasutilities/exportbenifitsummarydata/generate
 * Request :
 *          --> Parameters: planYear, envName
 * Response :
 *          --> success : Generated Excell file with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 600000ms = 600sec = 10min
 */
app.post('/hpasutilitiesGroup/exportproductsearchlogs/generate', timeout(600000), haltOnTimedout, (req, res) => {
    //var planYear = req.query.planYear;
    var envName = "QA";

    var startTime = new Date();
    //generateBsdFile.generateBsdExcelFile(planYear, envName, (result, err) => {
    generateSearchLogsExcelFIle.generateProductSearchLogsExcelFile(envName, (result, err) => {
        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

/*
 * To generate the Benefits Data for the specific environment & Plan Year when requested with resource /hpasutilities/benefits/generate
 * Request :
 *          --> Parameters: planYear, envName
 * Response :
 *          --> success : Generated Excell file with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 600000ms = 600sec = 10min
 */
app.post('/hpasutilitiesGroup/benefits/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;

    var startTime = new Date();
    generateBenefitsFile.generateBenifitsExcelFile(planYear, envName, (result, err) => {
        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});


/*
 * To send unique plan ID's for the specific environment when requested with resource /hpasutilities/exportmongodata/planids
 * Request :
 *          --> Parameters: envName,planYear
 * Response :
 *          --> success : array of PlanId's sorted for the environment requested with status 200
 *          --> failure : empty array with status 500
 * 
 * Timeout : 120000ms = 120sec = 2min
 */
app.post('/hpasutilitiesGroup/exportmongodata/planids', timeout(120000), haltOnTimedout, (req, res) => {
    let planYear = req.query.planYear;
    let envName = req.query.envName;
    let kafkaTopic = req.query.topic;
    let startTime = new Date();
    generateFile.retreivePlanIds(planYear, envName, kafkaTopic, (err, result) => {
        if (err) {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        } else {
            res.status(200).send(result.sort());
        }

        let endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

/*
 * To load custom attributes from the excel file for the specific environment when requested with resource /hpasutilities/exportmongodata/loadcustomattributes
 * Excel file will be read from the path "\\LOUAPPWDS183\HPASFiles\Mongo\Tags_Ben" with filename provided in the request
 * Excel file should be of the format (xlsx)
 * Request :
 *          --> Parameters: envName,fileName
 * Response :
 *          --> success : empty response with status 200
 *          --> failure : error occured with status 500
 */
app.post('/hpasutilities/exportmongodata/loadcustomattributes', (req, res) => {
    var envName = req.query.envName;
    var fileName = req.query.fileName;
    console.log('envName is ' + envName);
    console.log('fileName is ' + fileName);
    parseExcelFile.loadCustomAttributes(envName, fileName, (result, error) => {
        if (!error) {
            logger.log.info('loaded custom attributes successfully');
            res.status(200).send();
        }
        else {
            logger.logErrorResponse(req.id, error, 500);
           // console.log('error is ', error);
            res.status(500).send({ 'status': 500, 'error': error});
        }
    });
});

app.post('/hpasutilities/servers/check', timeout(600000), haltOnTimedout, (req, res) => {
   console.log('came here');
  // var fileName = req.query.fileName;
   var servers= JSON.parse(req.body.serverNames);
   
    var serverNames=servers.trim().split('\n');
    console.log('servers ', serverNames);
    checkKnownServers.checkServerInList(serverNames,(result,err)=>{
        if(result){
            res.status(200).send(result); 
        }else {
            console.log('error is ',err);
            res.status(500).send(err);
        }
    });
  //  logger.log.info(servers, 'servers');
    var startTime = new Date();
    
});

// /////////////       individual   /////////////////////////////////////////

app.get('/hpasutilities/exportmongodata/planyears', (req, res) => {
    var mienvName = req.query.mienvName;
    console.log('Medicare Individual mienvName is ' + mienvName);
    generateMIFile.retreiveMIPlanYears(mienvName, (years, error) => {

        if (years) {
            logger.logResponse(req.id, years, 200);
            //console.log(years);
            res.status(200).send(years.sort().reverse());
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});


app.get('/hpasutilities/exportmongodata/planyearsKafka', (req, res) => {
    var mienvName = req.query.mienvName;
    console.log('Medicare Individual mienvName is ' + mienvName);
    generateKafkaFile.retreiveMIPlanYears(mienvName, (years, error) => {

        if (years) {
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});

// planyear 12042020 start
app.get('/hpasutilitiesGroup/exportmongodata/bsd/planyears', (req, res) => {
    var mienvName = req.query.mienvName;
    generateMIBsdFile.retreivePlanYears(mienvName, (years, error) => {

        if (years) {
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});
// planyear 12042020 end

app.post('/hpasutilities/exportmongodata/planids', timeout(120000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.miplanYear;
    var mienvName = req.query.mienvName;
    var mistartTime = new Date();
    generateMIFile.retreiveMIPlanIds(miplanYear, mienvName, (result, err) => {

        if (result) {
            console.log(result);
            res.status(200).send(result.sort());
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportmongodata/resyncplanids', timeout(120000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.miplanYear;
    var mienvName = req.query.mienvName;
    var mistartTime = new Date();
    resyncPlanIds.syncMIPlans(miplanYear, mienvName, (result, err) => {

        if (result) {
            res.status(200).send(result.sort());
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});


app.post('/hpasutilities/exportmongodata/resyncMGplanids', timeout(120000), haltOnTimedout, (req, res) => {
    var mgplanYear = req.query.mgplanYear;
    var mgenvName = req.query.mgenvName;
    var mistartTime = new Date();
    resyncPlanIds.syncMGPlans(mgplanYear, mgenvName, (result, err) => {

        if (result) {
            console.log("resultss");
            res.status(200).send(result.sort());
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportmongodata/resyncmiplans', timeout(120000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.miplanYear;
    var mienvName = req.query.mienvName;
    var miplanIDs = JSON.parse(req.body.miplanIds);
    var mistartTime = new Date();
    resyncPlanIds.updatePlanIds(mienvName, miplanIDs, (result, err) => {

        if (result) {
            //console.log('hpas result',result);
            res.status(200).send(result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportmongodata/resyncmgplans', timeout(120000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.mgplanYear;
    var mgenvName = req.query.mgenvName;
    var mgplanIDs = JSON.parse(req.body.mgplanIds);
    var mistartTime = new Date();
    resyncPlanIds.updatemgPlanIds(mgenvName, mgplanIDs, (result, err) => {

        if (result) {
            //console.log('hpas result',result);
            res.status(200).send(result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportmongodata/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.miplanYear;
    var mienvName = req.query.mienvName;
    console.log('body ', JSON.stringify(req.body));
    var mitabsRequired = JSON.parse(req.body.checkedTabs);
    var miplanIDs = JSON.parse(req.body.miplanIds);
    logger.log.info(mitabsRequired, 'mitabsSelected');
    logger.log.info(miplanIDs, 'miplanIds');
    console.log(miplanIDs);
    //console.log("in hpasutilities group");

    var mistartTime = new Date();
    generateMIFile.generateMIExcelFile(miplanYear, mienvName, mitabsRequired, miplanIDs, (result, err) => {

        if (result) {
            console.log('generalised MI File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportbenifitsummarydata/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    
    console.log(planYear);
    var startTime = new Date();
    generateMIBsdFile.generateMIBsdExcelFile(planYear, envName, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/exportnotupdatedplans/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    var diffHours = req.query.diffHours;
    var startTime = new Date();
    //console.log("in mi notupdatedplans");
    console.log('diffHours is ', diffHours);
    generateMINotUpdatedPlans.generateMINotUpdatePlansExcelFile(planYear, envName, diffHours, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/benefits/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;

    var startTime = new Date();
    generateMIBenefitsFile.generateMIBenifitsExcelFile(planYear, envName, (result, err) => {
        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilities/convert/getUTF', timeout(600000), haltOnTimedout, (req, res) => {
    console.log('/hpasutilities/convert/getUTF');
    var input = req.body;
    console.log('setEncoding');
    let response = setEncoding(JSON.stringify(input));
    console.log('send');
    res.status(200).send(JSON.parse(response));
});


app.get('/hpasutilitiesGroup/rxEvent/planyears', (req, res) => {
    var envName = req.query.envName;
    rxCodeMapping.retreivePlanYears(envName, (years, error) => {
        if (years) {
            
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    })
});

app.get('/hpasutilitiesGroup/rxEvent/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var planYear = req.query.planYear;
    var envName = req.query.envName;
    var startTime = new Date();
    rxCodeMapping.generateRxEvent(planYear, envName, (result, err) => {

        res.status(200).send(result);
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});


//for MI_MG events tab
app.get('/hpasutilitiesGroup/MiEvent/generate', timeout(600000), haltOnTimedout, (req, res) => {
    
    var envName = req.query.envName;
    var dateFrom = req.query.dateFrom;
    var dateTo = req.query.dateTo;
    var showErrors = req.query.showErrors;
    var startTime = new Date();
    /*console.log("MI_MG EVENT----")
    console.log(req.query)
    console.log(envName)
    console.log(dateFrom)
    console.log(dateTo)
    console.log(showErrors)*/
    generateMiMgEvents.generateMiMgEvents( envName, dateFrom, dateTo, showErrors, (result, err) => {
//console.log(result)
        res.status(200).send(result);
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});


cron.schedule('0 50 8 * * *', function() {
    if (cluster.isMaster) {
        console.log("Cron Job for RxCode Dashboard PROD")
        var envName = "PROD";
        var startTime = new Date();
        const currentYear = startTime.getFullYear();
        var currentYearString = currentYear.toString();
        var nextYearString = currentYear+1;
        nextYearString = nextYearString.toString();
        var lastYearString = currentYear-1;
        lastYearString = lastYearString.toString();
        let planYears = [nextYearString,currentYearString,lastYearString];
        let ctr = 0;
        let RXCodes = [];


        planYears.forEach(async planYear => {
            rxCodeMapping.generateRxEvent(planYear, envName, (result, err) => {
                asdf = result.length;
                ctr = ctr + 1;
                RXCodes.push(result);
                if(ctr === planYears.length) {
                    rxCodeExport.sendEmail(envName,RXCodes,os.hostname, (result, err) => {
                        var endTime = new Date();
                        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                    });
                }
            });
        });
    }
});
cron.schedule('0 0 9 * * *', function() {
    if (cluster.isMaster) {
        console.log("Cron Job for MIMG Dashboard PROD")
        let dateYesterday = moment().subtract(1, 'days');
        let dateToday = moment();
      
        let startDate = dateYesterday.clone().set({hour:8,minute:1,second:0,millisecond:0});
        let endDate = dateToday.clone().set({hour:8,minute:0,second:0,millisecond:0});
        const envName = "PROD"
        var startTime = new Date();

        generateMiMgEvents.generateMiMgEvents( envName, startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"), "true", (result, err) => {
            
            mimgExport.sendEmail(envName,result,os.hostname, (result, err) => {
            
                var endTime = new Date();
                logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
            });
        });
    }
});

cron.schedule('0 14 9 * * *', function() {
    if (cluster.isMaster) {
        console.log("Cron Job for RxCode Dashboard QA1")
        var envName = "QA";
        var startTime = new Date();
        const currentYear = startTime.getFullYear();
        var currentYearString = currentYear.toString();
        var nextYearString = currentYear+1;
        nextYearString = nextYearString.toString();
        var lastYearString = currentYear-1;
        lastYearString = lastYearString.toString();
        let planYears = [nextYearString,currentYearString,lastYearString];
        let ctr = 0;
        let RXCodes = [];

        planYears.forEach(async planYear => {
            rxCodeMapping.generateRxEvent(planYear, envName, (result, err) => {
                asdf = result.length;
                ctr = ctr + 1;
                RXCodes.push(result);
                if(ctr === planYears.length) {
                    rxCodeExport.sendEmail(envName,RXCodes,os.hostname, (result, err) => {
                        var endTime = new Date();
                        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                    });
                }
            });
        });
    }
});
cron.schedule('0 20 9 * * *', function() {
    if (cluster.isMaster) {
        console.log("Cron Job for MIMG Dashboard QA1")
        let dateYesterday = moment().subtract(1, 'days');
        let dateToday = moment();
      
        let startDate = dateYesterday.clone().set({hour:8,minute:1,second:0,millisecond:0});
        let endDate = dateToday.clone().set({hour:8,minute:0,second:0,millisecond:0});
        const envName = "QA"
        var startTime = new Date();

        generateMiMgEvents.generateMiMgEvents( envName, startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"), "true", (result, err) => {
            
            mimgExport.sendEmail(envName,result,os.hostname, (result, err) => {
            
                var endTime = new Date();
                logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
            });
        });
    }
});


/*cron.schedule('0 30 9 * * *', function() {
    if (cluster.isMaster) {
        console.log("Cron Job for RxCode Dashboard SIT")
        var envName = "SIT";
        var startTime = new Date();
        const currentYear = startTime.getFullYear();
        var currentYearString = currentYear.toString();
        var nextYearString = currentYear+1;
        nextYearString = nextYearString.toString();
        var lastYearString = currentYear-1;
        lastYearString = lastYearString.toString();
        let planYears = [nextYearString,currentYearString,lastYearString];
        let ctr = 0;
        let RXCodes = [];

        planYears.forEach(async planYear => {
            rxCodeMapping.generateRxEvent(planYear, envName, (result, err) => {
                asdf = result.length;
                 ctr = ctr + 1;
                RXCodes.push(result);
                if(ctr === planYears.length) {
                    rxCodeExport.sendEmail(envName,RXCodes,os.hostname, (result, err) => {
                        var endTime = new Date();
                        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                    });
                }
            });
        });
    }
});
cron.schedule('0 5 9 * * *', function() {
    if (cluster.isWorker && cluster.worker.id == 1) {
        console.log("Cron Job for MIMG Dashboard SIT")
        let dateYesterday = moment().subtract(1, 'days');
        let dateToday = moment();
      
        let startDate = dateYesterday.clone().set({hour:8,minute:1,second:0,millisecond:0});
        let endDate = dateToday.clone().set({hour:8,minute:0,second:0,millisecond:0});
        const envName = "SIT"
        var startTime = new Date();

        generateMiMgEvents.generateMiMgEvents( envName, startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"), "true", (result, err) => {
            
            mimgExport.sendEmail(envName,result,os.hostname, (result, err) => {
            
                var endTime = new Date();
                logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
                console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
            });
        });
    }
});*/
  
app.get('/hpasutilitiesGroup/rxEvent/generateEmail', timeout(600000), haltOnTimedout, async (req, res) => {
    var planYear = req.query.planYear;
    var envName = "SIT";
    var startTime = new Date();
    let planYears = ["2022"];
const timer = ms => new Promise(res => setTimeout(res, ms))

var ctr = 0;
planYears.forEach(async planYear => {
//async.each(planYears, async function(planYear, callback, err) {
    console.log("---"+planYear+"---"+ctr)
    var asdf = null;
    rxCodeMapping.generateRxEvent(planYear, envName, (result, err) => {
       
        console.log("result.length"+result.length)
        asdf = result.length;
        ctr = ctr + 1
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log(asdf)
        console.log(ctr)
        if(ctr === planYears.length) {
            console.log("complete");
            console.log("yeah--------2");
            rxCodeExport.sendEmail(envName,result,os.hostname, (result, err) => {
            
            });
        }
       // callback();
    });
});
});


app.get('/hpasutilitiesGroup/mimgEvent/generateEmail', timeout(600000), haltOnTimedout, async (req, res) => {
    let dateYesterday = moment().subtract(1, 'days');
      
    let startDate = dateYesterday.clone().startOf('day');
    let endDate = dateYesterday.clone().endOf('day');
    const envName = "SIT"
    var startTime = new Date();

    console.log(startDate.format("YYYY-MM-DDTHH:mm:ss"))
    console.log(endDate.format("YYYY-MM-DDTHH:mm:ss"))
    generateMiMgEvents.generateMiMgEvents( envName, startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"), "true", (result, err) => {
        //console.log(result)
        console.log(result.length)
        mimgExport.sendEmail(envName,result,os.hostname, (result, err) => {
           
            var endTime = new Date();
            logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
            console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
            res.status(200).send("asdf")
        });

    });
});

app.get('/hpasutilitiesGroup/exportmongodata/getMILogs', (req, res) => {
    var envName = req.query.envName;
    console.log('envName is ' + envName);
    syncPlans.getMILogs(envName, (logs, error) => {
        if (logs) {
            logger.logResponse(logs, 200);
            res.status(200).send(logs);
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(error, 500);
            res.status(500).send([]);
        }
    });
});

app.get('/hpasutilitiesGroup/exportmongodata/getMGLogs', (req, res) => {
    var envName = req.query.envName;
    console.log('envName is ' + envName);
    syncPlans.getMGRXLogs(envName, (logs, error) => {
        if (logs) {
            logger.logResponse(logs, 200);
            res.status(200).send(logs);
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(error, 500);
            res.status(500).send([]);
        }
    });
})

app.get('/hpasutilitiesGroup/exportmongodata/syncMIPlans', (req, res) => {
    var envName = req.query.envName;
    console.log('envName is ' + envName);
    syncPlans.syncMIPlans(envName, (result, err) => {
        console.log(result);
        miCleanUpEmail.sendEmail(envName, result, os.hostname, (result, err) => {
            
        });
        res.status(200).send("Ok");
    });
});

app.get('/hpasutilitiesGroup/exportmongodata/syncMGPlans', (req, res) => {
    var envName = req.query.envName;
    console.log('envName is ' + envName);
    syncPlans.syncMGPlans(envName, (result, err) => {
        console.log(result);
        mgCleanUpEmail.sendEmail(envName, result, os.hostname, (result, err) => {
            
        });
        res.status(200).send("OK");
    });
});

app.post('/hpasutilitiesGroup/exportmongodata/generateMIReport', timeout(600000), haltOnTimedout, (req, res) => {
    var envName = req.query.envName;
    var id = req.query.id;
    console.log('ID is ' + id);
    generateMICleanExcel.generateExcelFile(envName, id, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        }

    });
});

app.post('/hpasutilitiesGroup/exportmongodata/generateMGReport', timeout(600000), haltOnTimedout, (req, res) => {
    var envName = req.query.envName;
    var id = req.query.id;
    console.log('ID is ' + id);
    generateMGCleanExcel.generateExcelFile(envName, id, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        }

    });
});

//Medicaid FE20.9 Start --

/*
 * Medicaid FR20.9 - Get Effective Year
 */

app.get('/hpasutilities/exportmongodata/effYears', (req, res) => {
    var envName = req.query.mienvName;

    generateMedicaidFile.retreiveEffYears(envName, (effYears, error) => {

       if(effYears){
        const years = effYears.filter(element => {
            return element !== null;
          });       

        if (years) {
            logger.logResponse(req.id, years, 200);
            res.status(200).send(years.sort().reverse());
        }
        else {
            console.log('error occured', error);
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
    }
    })
});

//Get Medicaid Plan IDs

app.post('/hpasutilities/exportmongodata/medicaidPlanIds', timeout(120000), haltOnTimedout, (req, res) => {
    var miplanYear = req.query.miplanYear;
    var mienvName = req.query.mienvName;
    var mistartTime = new Date();
    //console.log(miplanYear);
    generateMedicaidFile.retreiveMedicaidPlanIds(miplanYear, mienvName, (result, err) => {

        if (result) {
           // console.log(result);
            res.status(200).send(result.sort());
        } else {
            logger.logErrorResponse(req.id, error, 500);
            res.status(500).send([]);
        }
        var miendTime = new Date();
        logger.log.info('Time taken for this request is', (miendTime - mistartTime) / 1000, ' seconds');
    });
});

app.post('/hpasutilitiesGroup/exportMedicaidData/generate', timeout(600000), haltOnTimedout, (req, res) => {
    var effYear = req.query.effYear;
    var envName = req.query.envName;
    console.log('body ', JSON.stringify(req.body));
    var tabsRequired = JSON.parse(req.body.checkedTabs);
    var planIDs = JSON.parse(req.body.medicaidPlanids);
    logger.log.info(tabsRequired, 'tabsSelected');
    logger.log.info(planIDs, 'planIds');

    var startTime = new Date();
    generateMedicaidFile.generateMedicaidExcelFile(effYear, envName, tabsRequired, planIDs, (result, err) => {

        if (result) {
            console.log('generalised File Name ' + result);
            res.status(200).download('./' + result);
        } else {
            logger.logErrorResponse(req.id, err, 500);
            res.status(500).send([]);
        }
        var endTime = new Date();
        logger.log.info('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
        console.log('Time taken for this request is', (endTime - startTime) / 1000, ' seconds');
    });
});

//Medicaid FR20.09B End ---

function setEncoding(strPlan) {

  const winToUtf = [
    {win: /\u0093/g, utf: "\u201C"},
    {win: /\u0094/g, utf: "\u201D"},
    {win: /\u0096/g, utf: "\u2013"},
    {win: /\u0092/g, utf: "\u2032"},
    {win: /\u0099/g, utf: "\u2122"}
  ]
  //{win: "\u0093", utf: "\u201C"}
  var strReplace = strPlan;
  winToUtf.forEach(encoding => {
    strReplace = strReplace.replace(encoding.win, encoding.utf);
  });
  return strReplace;

}


cron.schedule('0 30 17 * * *', function() {
    if (cluster.isMaster) {
        console.log("Master-1")
	console.log(process.env.NODE_APP_INSTANCE + "-1")
    } else {
        console.log("not Master-2")
	console.log(process.env.NODE_APP_INSTANCE+ "-2")
	console.log(cluster.worker.id+ "-2");

}
if (cluster.isWorker && cluster.worker.id == 1) {
	console.log("yeeeey!");
}
});

////////////////////////////////////////////////////////////////
function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}

/*
 * For Preformance Optimization
 * The below code will help to effectively utilise the resources provided
 * 
 */
if (cluster.isMaster) {
    numCPUs.forEach((cpu) => {
        const worker = cluster.fork();
        worker.send('hi there');
    });
} else if (cluster.isWorker) {
    var server = app.listen(3005, () => { console.log(`Listening on port ${server.address().port} for id ${cluster.worker.id}`) });
    server.timeout = 1000 * 60 * 10; // 10 minutes
    process.on('message', (msg) => {
        process.send(msg);
    });
}