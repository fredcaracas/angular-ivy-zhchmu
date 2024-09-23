//file created for FR446.2
var crypto = require('crypto');
var Excel = require('exceljs');
const logger = require('../Main/logger.js');
const config = require('../config/loadConfig.js');
const { Kafka } = require("kafkajs");
const moment = require('moment');
const miKafkaMessageTab = require('../ExcelTabs/miKafkaMessageTab.js');
const mongoData = require('../db/mongodb.js');


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

const MG_TOPICS = [
    'hpas-psh-grp-pln-rx-map',
    'hpas-psh-medicare-grp-pln',
    'hpas-psh-medicare-grp-pln-cpy',
    'hpas-psh-medicare-grp-refrsh-pln-option',
    'hpas-psh-medicare-grp-refrsh-rx-code'
];

var generateKafkaExcelFile = (envName, planYear, messageArray,lov,callback) => {
    isExcelInititated = true;
    console.log('Aca llego');
    // readKafkaMessages(envName, planYear, kafkaTopic,planIds, callback);
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    if(lov == "MI"){
        var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MI_KafkaMessage_' + datetime + '.xlsx';
    }
    if( lov == "MG"){
        var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/MG_KafkaMessage_' + datetime + '.xlsx';
    }
    
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Anuja Kate';
    workbook.lastModifiedBy = 'Anuja Kate';
    workbook.created = new Date();

    if(lov == "MI"){
        global.ws1 = workbook.addWorksheet('MI Kafka Message');
    }
    if(lov == "MG"){
        global.ws1 = workbook.addWorksheet('MG Kafka Message');
    }
    
    miKafkaMessageTab.configureTab(ws1, styleValues);
    ws1.getRow('1').font = headerFont;
    miKafkaMessageTab.loadRowData(ws1, messageArray);
    ws1.autoFilter = 'A1:C1';
            workbook.commit()
                .then(() => {
                    logger.log.info('file creation completed !!');
                    callback(generatedFileName);
                }).catch((err) => {
                    logger.log.error('error caught while writing to excell file is ', err);
                    callback(undefined, err);
                });
    

    
}

const extractDataFromTransactionId = (transactionId = '') => {
    let data = {};
    let transactionIdSplits = transactionId.split('_');
    if (transactionIdSplits.length < 3) {
        console.log('Incorret transactionId format: ', transactionId);
        return data;
    }
    let mjs = moment(transactionIdSplits[2], 'MMDDYYYYkkmmssSS').format('MM-DD-YYYY kk:mm:ss.SS');
    data.lastModifiedDate = mjs;
    data.planId = transactionIdSplits[1];
    return data;
}

// unable to get transactionId for "mi-all-status-pub-sub" and "mi-apprv-actv-pub-sub"
const formatKafkaMessageForMongo = (topic, partition, { value, offset }) => {
    let message = JSON.parse(value.toString());
    let mongoDoc = { topic, partition, offset: Number(offset), message };
    let planId, planYear, lastModifiedDate;

    if (message?.Product) {
        planYear = message.Product?.PlanHeader?.PlanYear;
        planId = message.Product?.PlanHeader?.PlanID;
        let transactionData = extractDataFromTransactionId(message.Product?.About?.TransactionID);
        lastModifiedDate = transactionData.lastModifiedDate;
        if (!planId && message.Product?.PlanHeader?.PackageAssociation) {
            // medicare-grp-refrsh-pln-option
            planId = `${planYear}-${message.Product?.PlanHeader?.PackageAssociation.Plan}-${message.Product?.PlanHeader?.PackageAssociation.Option}-${message.Product?.PlanHeader?.PackageAssociation.RxNumber}-${message.Product?.PlanHeader?.PackageAssociation.PDPNumber}`;
        } else if (!planId) {
            // medicare-grp-plan
            planId = transactionData.planId;
        }
    } else if (message?.ProductEvent) {
        // medicare-indv-pln-cpy
        // medicare-grp-pln-cpy
        planYear = message.ProductEvent?.ProductUpdate?.Product?.PlanHeader?.PlanYear;
        planId = message.ProductEvent?.ProductUpdate?.Product?.PlanHeader?.PlanID;
        let transactionData = extractDataFromTransactionId(message.ProductEvent?.TransactionID);
        lastModifiedDate = transactionData.lastModifiedDate;
        if (!planId) {
            // medicare-grp-pln-cpy
            planId = transactionData.planId;
        }
    } else if (message?.RxCodeMapping) {
        // grp-pln-rx-map
        // medicare-grp-refrsh-rx-code
        planYear = message.RxCodeMapping?.PlanYear;
        let transactionData = extractDataFromTransactionId(message.RxCodeMapping?.TransactionID);
        planId = transactionData.planId;
        lastModifiedDate = transactionData.lastModifiedDate;
    } else {
        console.log('Unrecognizded data format: ', message);
    }

    mongoDoc.planId = planId;
    mongoDoc.planYear = planYear;
    mongoDoc.lastModifiedDate = lastModifiedDate;
    return mongoDoc;
}

const generateExcelFromSyncData = async (planYear, envName, kafkaTopic, planIds, lov, callback) => {
    try {
        const gConfig = config.getConfig(envName);
        if (!gConfig) {
            return callback({ msg: 'No config found' });
        }

        if (MG_TOPICS.includes(kafkaTopic)) {
            // remove trailing '-' from mg topics
            planIds = planIds.map(planId => {
                let lastElementIndex = planId.length - 1;
                if (planId[lastElementIndex] === '-') {
                    planId = planId.substring(0, lastElementIndex);
                }
                return planId;
            });
        }

        const decipher = crypto.createDecipher("aes192", gConfig.saslKey);
        let decrypted = decipher.update(gConfig.saslencpass, "hex", "utf8");
        decrypted += decipher.final("utf8");

        const kafka = new Kafka({
            brokers: gConfig.kafkaHost,
            ssl: true,
            sasl: {
                mechanism: "scram-sha-256",
                username: "hpas-psh-svc-user",
                password: decrypted,
            },
        });

        const timestampBefore = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const admin = kafka.admin();
        await admin.connect();
        const topicOffsetsFromKafka = await admin.fetchTopicOffsets(kafkaTopic);
        const topicOffsetsFromKafkaBefore = await admin.fetchTopicOffsetsByTimestamp(kafkaTopic, timestampBefore);
        console.log('topicOffsetsFromKafka: ', topicOffsetsFromKafka);
        console.log('topicOffsetsFromKafkaBefore: ', topicOffsetsFromKafkaBefore);
        await admin.disconnect();

        const mongoClient = mongoData.initializeMongoClient(gConfig);
        let maxOffsetFromKafka = Math.max(...topicOffsetsFromKafka.map(p => Number(p.high)));
        let minOffsetFromKafkaBefore = Math.min(...topicOffsetsFromKafkaBefore.map(p => Number(p.offset)));
        console.log('maxOffsetFromKafka: ', maxOffsetFromKafka);
        console.log('minOffsetFromKafkaBefore: ', minOffsetFromKafkaBefore);

        let kafkaMessages = await mongoData.getKafkaMessages(mongoClient, kafkaTopic, planIds, planYear, minOffsetFromKafkaBefore, maxOffsetFromKafka);
        kafkaMessages = kafkaMessages.map(({ topic, planId, lastModifiedDate }) => ({ topicName: topic, PlanID: planId, lastModifiedDate }));
        await mongoClient.close();
        if (kafkaMessages.length === 0) {
            return callback({ msg: 'No matching records found to generate excel' });
        }
        return generateKafkaExcelFile(envName, planYear, kafkaMessages, lov, (fileName) => {
            callback(null, fileName);
        });
    } catch (err) {
        console.error(err);
        callback(err);
    }
}

const syncKafkaMessages = async (envName, kafkaTopic, callback) => {
    try {
        const gConfig = config.getConfig(envName);
        if (!gConfig) {
            return callback({ msg: 'No config found' });
        }

        const decipher = crypto.createDecipher("aes192", gConfig.saslKey);
        let decrypted = decipher.update(gConfig.saslencpass, "hex", "utf8");
        decrypted += decipher.final("utf8");

        const kafka = new Kafka({
            brokers: gConfig.kafkaHost,
            ssl: true,
            sasl: {
                mechanism: "scram-sha-256",
                username: "hpas-psh-svc-user",
                password: decrypted,
            },
        });

        const timestampBefore = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const admin = kafka.admin();
        await admin.connect();
        const topicOffsetsFromKafka = await admin.fetchTopicOffsets(kafkaTopic);
        const topicOffsetsFromKafkaBefore = await admin.fetchTopicOffsetsByTimestamp(kafkaTopic, timestampBefore);
        // console.log('topicOffsetsFromKafka: ', topicOffsetsFromKafka);
        // console.log('topicOffsetsFromKafkaBefore: ', topicOffsetsFromKafkaBefore);
        await admin.disconnect();

        const mongoClient = mongoData.initializeMongoClient(gConfig);
        const topicOffsetsFromMongo = await mongoData.getTopicOffsets(mongoClient, kafkaTopic);
        // console.log('topicOffsetsFromMongo: ', topicOffsetsFromMongo);
        let maxOffsetFromKafka = Math.max(...topicOffsetsFromKafka.map(p => Number(p.high)));
        let maxOffsetFromMongo = Math.max(...topicOffsetsFromMongo.map(p => Number(p.offset)));
        // let minOffsetFromKafkaBefore = Math.min(...topicOffsetsFromKafkaBefore.map(p => Number(p.offset)));
        let maxOffsetFromKafkaBefore =Math.max(...topicOffsetsFromKafkaBefore.map(p => Number(p.offset)));
        // console.log('maxOffsetFromKafka: ', maxOffsetFromKafka);
        // console.log('maxOffsetFromMongo: ', maxOffsetFromMongo);
        // console.log('minOffsetFromKafkaBefore: ', minOffsetFromKafkaBefore);

        if (maxOffsetFromKafka === maxOffsetFromKafkaBefore) {
            return callback(null, {msg: 'No new data to sync'});
        } else if(maxOffsetFromMongo >= maxOffsetFromKafka - 1) {
            return callback(null, {msg: 'Already sync done'});
        }

        let topicOffsets = topicOffsetsFromKafka.map(({ partition, low }) => {
            let offsetTopic = {
                topic: kafkaTopic,
                syncDone: false,
                partition
            };
            let topicOffsetBefore = topicOffsetsFromKafkaBefore.find(po => po.partition === partition);
            if (topicOffsetsFromMongo.length) {
                let topicOffsetMongo = topicOffsetsFromMongo.find(po => po._id === partition);
                if (topicOffsetMongo) {
                    offsetTopic.offset = topicOffsetMongo.offset > topicOffsetBefore.offset ? topicOffsetMongo.offset : topicOffsetBefore.offset;
                } else {
                    offsetTopic.offset = topicOffsetBefore.offset > low ? topicOffsetBefore.offset : low;
                }
            } else {
                offsetTopic.offset = topicOffsetBefore.offset > low ? topicOffsetBefore.offset : low;
            }
            return offsetTopic;
        });

        const consumer = kafka.consumer({
            groupId: `cgrp-hpas-psh-medicare-indv-${Date.now()}`
        });

        await consumer.connect();
        await consumer.subscribe({ topic: kafkaTopic, fromBeginning: true });
        let isConsumerDisconnected = false;
        await new Promise(async resolve => {
            let isSeekSet = false;
            let timeoutId = setTimeout(async () => {
                await consumer.disconnect();
                isConsumerDisconnected = true;
                return resolve();
            }, 5 * 60 * 1000);

            await consumer.run({
                eachBatch: async ({ batch, pause }) => {
                    // console.log(`eachBatch partition: ${batch.partition} firstOffset: ${batch.firstOffset()}, lastOffset: ${batch.lastOffset()}`);
                    if (!isSeekSet) {
                        topicOffsets.forEach(({ topic, partition, offset }) => {
                            consumer.seek({ topic, partition, offset });
                            // console.log(`seek set for partition: ${partition} to offset: ${offset}`);
                        });
                        isSeekSet = true;
                        return;
                    }

                    let dataToInsertIntoMongo = batch.messages.map(message => formatKafkaMessageForMongo(batch.topic, batch.partition, message));
                    await mongoData.insertKafkaData(mongoClient, kafkaTopic, dataToInsertIntoMongo);

                    let topicOffsetFromKafka = topicOffsetsFromKafka.find(po => po.partition === batch.partition);
                    // console.log(`sync check partition: ${batch.partition} lastoffset: ${batch.lastOffset()}, topicoffsetfromkafka: ${topicOffsetFromKafka.high}`);
                    if (batch.lastOffset() >= topicOffsetFromKafka.high - 1) {
                        let topicOffset = topicOffsets.find(po => po.partition === batch.partition);
                        topicOffset.syncDone = true;
                        // console.log('syncDone = true');
                    }

                    if (topicOffsets.every(p => p.syncDone)) {
                        // console.log('all syncDone..closing consumer');
                        pause();
                        clearTimeout(timeoutId);
                        return resolve();
                    }
                }
            });
        });

        await mongoClient.close();
        if (isConsumerDisconnected) {
            return callback(null, { msg: 'Request timed out! We have more data to sync. Please sync again.' });
        }

        await consumer.disconnect();
        return callback(null, {msg: 'Sync done'});
    } catch (err) {
        console.error(err);
        callback(err);
    }
}

module.exports.syncKafkaMessages = syncKafkaMessages;
module.exports.generateExcelFromSyncData = generateExcelFromSyncData;