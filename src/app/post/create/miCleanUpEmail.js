const config = require('../commonConfig/config/loadConfig.js');
var moment = require('moment-timezone');
var request = require('request')
var Excel = require('exceljs');
const mongodb = require('../commonConfig/db/mongodb.js');
moment().tz("America/New_York").format();

var sendEmail = (envName, result, hostname, callback) => {
  try {

    const currentdate = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hourCycle: 'h23' });
    var datetime = currentdate.split("/").join("-")
    datetime = datetime.replace(',', '');
    let mailSubject = "";
    let mailFormat;
    if (result == 'Success') {
      mailSubject = "SUCCESS – Product Service Hub " + datetime + " clean-up in " + envName + " MI";
      mailFormat = 'Hi, <br><br> This is the Product Service Hub clean-up summary which was executed on ' + datetime + ' for MI. Attached is the detailed report of the clean-up. <br><br>' +
        '<Strong>Note:</Strong> <ul><li>PDH delta deployment is still in-process, please wait until it is finished to use the PSH system</li><li>PFP keys are restored from PSH PROD environment.</li></ul><br><br> Thanks,<br>Product Service Hub.';

    } else {
      mailSubject = "FAILED – Product Service Hub " + datetime + " clean-up in " + envName + " MI";
      mailFormat = 'Please contact your System Administrator.';

    }

    config.loadConfig(envName, async (gConfig, err) => {
      if (gConfig) {

        var plansArray = [];
        var plansData = {};

        mongodb.connect(gConfig, async (db, mongoDbErr) => {
          if (mongoDbErr) {
            console.error(mongoDbErr)
          } else {

            let collection = db.collection('post_clone_logs')
            const result = await collection.find({ 'LOB': 'Medicare Individual' }).toArray();
            result.sort(function (a, b) { return b.ExecutionTime - a.ExecutionTime });

            plansArray = result[0].Data;
    
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

            var generatedFileName = 'MedicareIndividual_Clean_Up_' + envName + '_Generated_' + datetime + '.xlsx';


            let workbook = new Excel.Workbook();

            let ws1 = workbook.addWorksheet('MI Plans');
            ws1.columns = [
              { header: '', key: 'count', width: 5, style: headerFont },
              { header: 'PLAN_YEAR', key: 'planYear', width: 18, style: headerFont },
              { header: 'PLAN_ID', key: 'planid', width: 30, style: headerFont },
              { header: 'STATUS', key: 'status', width: 20, style: headerFont }
            ];
            ws1.getRow('1').font = headerFont;
            ws1.autoFilter = 'B1:C1';
            var count = 1;
            for (var i = 0; i < plansArray.length; i++) {
              ws1.addRow([count, plansArray[i].PlanYear, plansArray[i].PlanID, plansArray[i].Status]);
              count++;
            }
            const buff = await workbook.xlsx.writeBuffer();
            buffer = buff.toString('base64');
            var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
              "<EmailRequest>" +
              "<EAPMID>15820</EAPMID>" +
              "<Env>" + envName + "</Env>" +
              "<From>" + gConfig.mailCleanUP.from + "</From>" +
              "<IsHTMLContent>1</IsHTMLContent> " +
              "<Priority>" + gConfig.mailCleanUP.prioirty + "</Priority> " +
              "<SendTo>" + gConfig.mailCleanUP.to + "</SendTo> " +
              "<SenderAppName>" + gConfig.mailCleanUP.appname + "</SenderAppName> " +
              "<Subject>" + mailSubject + "</Subject> " +
              "<Content><![CDATA[" + mailFormat + "]]></Content>" +
              "<HasAttachments>true</HasAttachments>" +
              "<AttachmentData>" + buffer + "</AttachmentData>" +
              "<AttachmentFileName>" + generatedFileName + "</AttachmentFileName>" +
              "</EmailRequest>";

            var args = {
              data: xml,
              headers: { "Content-Type": "application/xml" }
            };

            request.post({
              url: gConfig.mailCleanUP.endpointurl,
              method: 'POST',
              header: args.headers,
              strictSSL: false,
              secureProtocol: 'TLSv1_2_method',
              body: args.data
            }, function (error, response, body) {
              if (error) {
                console.log('error occured while sending mail is ', error);
              } else {
                console.log('response from mail service is ', body);
              }
              callback("success");
            })


          }
        })
      }
    })
  } catch (err) {
    console.error(err);
  } finally {
  }
}


module.exports.sendEmail = sendEmail;