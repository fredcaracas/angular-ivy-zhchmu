var Excel = require('exceljs');
const config = require('../config/loadConfig.js');
var moment = require('moment-timezone');
var request = require('request')
moment().tz("America/Los_Angeles").format();

var sendEmail = (envName, failedEvents,hostname, callback) => {
  try {
    config.loadConfig(envName, async (gConfig, err) => {
      if (gConfig) {
        let mailSubject = "MI/MG Dashboard Failed Plans in " + envName;
        let mailFormat = "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">";
        
        
          let workbook = new Excel.Workbook();
          if(failedEvents.length > 0) {
            mailFormat = mailFormat + "Please see attached file for MI/MG Plans that failed yesterday.<br>";
            const worksheet = workbook.addWorksheet("Sheet1");
            worksheet.columns = [
              {header: 'LOB', key: 'lob', width: 15},
              {header: 'Transaction ID', key: 'transactionID', width: 55},
              {header: 'Plan Year', key: 'planYear', width: 15},
              {header: 'Plan ID', key: 'planID', width: 25},
              {header: 'Caching Status', key: 'cachingStatus', width: 25},
              {header: 'Last Cached Time', key: 'lastCachedTime', width: 30},
              {header: 'Sync to PSH', key: 'syncToPSH', width: 15},
              {header: 'Event Type', key: 'EventType', width: 15},
              {header: 'Event Status', key: 'EventStatus', width: 15}
            ];

            let columns = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
            columns.forEach((column) => {
              worksheet.getCell(column).border= {
                top: {style:'medium'},
                left: {style:'medium'},
                bottom: {style:'medium'},
                right: {style:'medium'},
              };
              worksheet.getCell(column).font = {
                bold: true,
              };
              worksheet.getCell(column).alignment = { vertical: 'middle', horizontal: 'center' };
            });
	    let sortedArray  = failedEvents.sort((a,b) => moment(b.LAST_CACHED_TIME,"YYYY-MM-DD hh:mm:ss.SSSS A") - moment(a.LAST_CACHED_TIME,"YYYY-MM-DD hh:mm:ss.SSSS A"))

            for(var i = 0; i < sortedArray.length; i++){

              var rowValues =  {
                lob: sortedArray[i].LOB,
                transactionID: sortedArray[i].TRANSACTION_ID,
                planYear: sortedArray[i].PLAN_YEAR,
                planID: sortedArray[i].PLAN_ID,
                cachingStatus: sortedArray[i].CACHING_STATUS,
                lastCachedTime: sortedArray[i].LAST_CACHED_TIME,
                syncToPSH: sortedArray[i].SYNC_TO_PSH,
                EventType: sortedArray[i].EVENT_TYPE,
                EventStatus: sortedArray[i].EVENT_STATUS
              };
              let row = worksheet.addRow(rowValues);
              cells = [1,2,3,4,5,6,7,8,9];
              cells.forEach((cell) => {
                row.getCell(cell).border= {
                  top: {style:'medium'},
                  left: {style:'medium'},
                  bottom: {style:'medium'},
                  right: {style:'medium'}
                }
              });
            }
            worksheet.autoFilter = 'A1:I1';
            //workbook.xlsx.writeFile('C:/Sampledata/export2.xlsx');

          } else {
            mailFormat = mailFormat + "Yesterday there were no failed MI/MG plans.<br>";
            mailSubject = "MI/MG Dashboard All plan events successful in " + envName;
          }
          mailFormat = mailFormat + "<br>Thank you.<br><font size='1'>(Email sent from server name = " + hostname+")</font>";
          
          const date = moment()
          const filename = 'MIMG_Dashboard_'+date.format('YYYY-MM-DD_hh-mm-ss')+'.xlsx';
          const buff = await workbook.xlsx.writeBuffer();
          var buffer = buff.toString('base64');
          var xml="<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"+
            "<EmailRequest>"+
            "<EAPMID>15820</EAPMID>"+
            "<Env>"+envName+"</Env>"+
            "<From>"+gConfig.mail.from+"</From>"+
            "<IsHTMLContent>1</IsHTMLContent> "+
            "<Priority>"+gConfig.mail.prioirty+"</Priority> "+
            "<SendTo>"+gConfig.mail.to+"</SendTo> "+
            "<SenderAppName>"+gConfig.mail.appname+"</SenderAppName> "+
            "<Subject>"+  mailSubject +"</Subject> "+
            "<Content><![CDATA["+mailFormat+"]]></Content>";
          
          if(failedEvents.length > 0){
            xml = xml + 
            "<HasAttachments>true</HasAttachments>"+
            "<AttachmentData>" + buffer + "</AttachmentData>"+ 
            "<AttachmentFileName>" + filename + "</AttachmentFileName>";
          }
          xml = xml + "</EmailRequest>";

          var args = {
              data: xml,
              headers: { "Content-Type": "application/xml" }
          };

          request.post({
            url: gConfig.mail.endpointurl,
            method: 'POST',
            header: args.headers,
            strictSSL: false,
            secureProtocol: 'TLSv1_2_method',
            body: args.data
          }, function(error, response, body) {
            if(error){
              console.log('error occured while sending mail is ',error);
            }else {
              console.log('response from mail service is ',body);
            }
          callback("success");
          })
          //console.log(moment.duration(moment(rxCodes[0].MODIFIED_DT,"YYYY-MM-DD hh:mm:ss.SSSS A").diff(dateYesterday.format("YYYY-MM-DDTHH:mm:ss.SSSS"))).asMinutes())
        callback("");
      } else {
        callback(err);
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
  }
}


module.exports.sendEmail = sendEmail;