var bunyan = require('bunyan');
var RotatingFileStream = require('bunyan-rotating-file-stream');
require('rotating-file-stream');
var path = require('path');
var fs = require('fs');
var dir = './Logs';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

exports.log = bunyan.createLogger({
    name: "MongoExportLogger",
    streams: [
        {
            level: 'info',
            stream: process.stdout            // log INFO and above to stdout
        },
        {
            level: 'info',
            stream: new RotatingFileStream({
                path: path.join(__dirname, 'Logs', 'mongoExport_info.log'),
                period: '1d',      // daily rotation
                totalFiles: 10,         // keep up to 10 back copies
                rotateExisting: false,   // Give ourselves a clean file when we start up, based on period
                threshold: '10m',       // Rotate log files larger than 10 megabytes
                totalSize: '20m',       // Don't keep more than 20mb of archived log files
                gzip: false             // Compress the archive log files to save space
            })
        }
    ],
    serializers: {
        req: require('bunyan-express-serializer'),
        res: bunyan.stdSerializers.res,
        err: bunyan.stdSerializers.err
    }
});

exports.logResponse = function (id, body, statusCode) {
    var log = this.log.child({
        id: id,
        body: body,
        statusCode: statusCode
    }, true)
    log.info('response')
}

exports.logErrorResponse = function (id, error, statusCode) {
    var log = this.log.child({
        id: id,
        error: error,
        statusCode: statusCode
    }, true)
    log.info('response')
}