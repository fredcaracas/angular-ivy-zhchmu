/*History: Added SPAP Program related tabs on 29/09/2021 Author: KiranKumar Padi (KXP0380)*/
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var Excel = require('exceljs');
const logger = require('../commonConfig/Main/logger.js');


// including individual tabs info 
var planHeaderTab = require('../commonConfig/ExcelTabs/planHeaderTab.js');
var planMemberCostTab = require('../commonConfig/ExcelTabs/planMemberCostTab.js');
var planMemberCostsTab = require('../commonConfig/ExcelTabs/planMemberCostsTab.js');
var medicalCostShareTab = require('../commonConfig/ExcelTabs/medicalCostShareTab.js');
//var medicalBenifitTab = require('./ExcelTabs/medicalBenifitTab');
var medicalBenifitsMemberCostsTab = require('../commonConfig/ExcelTabs/medicalBenifitsMemberCostTab');
var medicalBenifitsLimitsExclusionsTab = require('../commonConfig/ExcelTabs/medicalBenifitsLimits&ExclusionsTab');
var medicalBenifitsExclusionsTab = require('../commonConfig/ExcelTabs/medicalBenifitsExclusionsTab');
var medicalBenifitsWaiversTab = require('../commonConfig/ExcelTabs/medicalBenifitsWaiversTab');
var lisPremiumTab = require('../commonConfig/ExcelTabs/lisPremiumTab.js');
var serviceAreaListTab = require('../commonConfig/ExcelTabs/serviceAreaListTab.js');
var serviceAreaTab = require('../commonConfig/ExcelTabs/serviceAreaTab.js');
var businessCategoryTab = require('../commonConfig/ExcelTabs/businessCategoryTab.js');
var subPackagePBPNoteTab = require('../commonConfig/ExcelTabs/subPackagePBPNoteTab');
var pharmacyPackageTab = require('../commonConfig/ExcelTabs/pharmacyPackageTab');
var pharmacyPackageBenefitTab = require('../commonConfig/ExcelTabs/pharmacyPackageBenefitTab');
var pharmacyPackageDeductibleTab = require('../commonConfig/ExcelTabs/pharmacyPackageDeductibleTab');
var pharmacyPackageAdultACIPVaccineBenefitTab = require('../commonConfig/ExcelTabs/pharmacyPackageAdultACIPVaccineBenefitTab');
var pharmacyPackageExcludedDrugsTab = require('../commonConfig/ExcelTabs/pharmacyPackageExcludedDrugsTab');
var subPackageListTab = require('../commonConfig/ExcelTabs/subPackageListTab');
var subPackageMemberCostsTab = require('../commonConfig/ExcelTabs/subPackageMemberCostsTab');
var subPackageBenifitsTab = require('../commonConfig/ExcelTabs/subPackageBenifitsTab');
var subPackageBenifitLimitsTab = require('../commonConfig/ExcelTabs/subPackageBenifitLimitsTab');
var subPackageTransportationTab = require('../commonConfig/ExcelTabs/subPackageTransportationTab');
var medicareIndividualTab = require('../commonConfig/ExcelTabs/medicareIndividualTab');
var authorizationReferalGroupTab = require('../commonConfig/ExcelTabs/authorizationReferalGroupTab');
var implementationAreaTab = require('../commonConfig/ExcelTabs/implementationAreaTab');
var psychCodeTab = require('../commonConfig/ExcelTabs/psychCodeTab');
var SPAPProgramDetailsTab = require('../commonConfig/ExcelTabs/SPAPProgramDetailsTab');
var SPAPProgramContactTab = require('../commonConfig/ExcelTabs/SPAPProgramContactTab');
var SPAPLISAuditTab = require('../commonConfig/ExcelTabs/SPAPLISAuditTab');
var implementationNetworkTab = require('../commonConfig/ExcelTabs/implementationNetworkTab');
var specialNeedsPlanTab = require('../commonConfig/ExcelTabs/specialNeedsPlanTab');
var PFPInfoTab = require('../commonConfig/ExcelTabs/PFPInfoTab');
var TagsTab = require('../commonConfig/ExcelTabs/TagsTab');
//var customAttributesTab = require('./ExcelTabs/customAttributesTab');
var aboutTab = require('../commonConfig/ExcelTabs/aboutTab');

//Environment configuration will be happened inside /config/loadConfig.js
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

// var workbook;// = new Excel.stream.xlsx.WorkbookWriter(options);

var generateMIExcelFile =  (planYear, envName, tabsRequired, planIds, callback) => {

    //console.log("in generateMIExcelFile");
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "_" + (currentdate.getMonth() + 1) + "_" + currentdate.getFullYear() + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() + "_" + currentdate.getSeconds();
    var generatedFileName = './MongoExport/commonConfig/GeneratedFiles/Mongo_Extract_data_' + envName + '_' + planYear + '_Generated_' + datetime + '.xlsx';
    var options = {
        filename: generatedFileName,
        useStyles: true,
        useSharedStrings: true
    };

    global.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Srikanth Lekkala';
    workbook.lastModifiedBy = 'Srikanth Lekkala';
    workbook.created = new Date();


    if (tabsRequired.planHeaderDetails == true) {
        global.ws1 = workbook.addWorksheet('Plan Header');
        planHeaderTab.configureTab(ws1, styleValues);
        ws1.getRow('1').font = headerFont;
        ws1.autoFilter = 'A1:Y1';
    }
    if (tabsRequired.pfpInfo == true) {
        global.ws28 = workbook.addWorksheet('PFPInfo');
        PFPInfoTab.configureTab(ws28, styleValues);        
        ws28.getRow('1').font = headerFont;
        ws28.autoFilter = 'A1:C1';
    }
    if (tabsRequired.medicareIndividual == true) {
        global.ws33 = workbook.addWorksheet('Medicare Individual');
        medicareIndividualTab.configureTab(ws33, styleValues);
        ws33.getRow('1').font = headerFont;
        ws33.autoFilter = 'A1:I1';
    }
    if (tabsRequired.specialNeedsPlanDetails == true) {
        global.ws17 = workbook.addWorksheet('Special Needs Plan');
        specialNeedsPlanTab.configureTab(ws17, styleValues);
        ws17.getRow('1').font = headerFont;
        ws17.autoFilter = 'A1:G1';
    }
    if (tabsRequired.implementationAreaDetails == true) {
        global.ws10 = workbook.addWorksheet('Implementation Area');
        implementationAreaTab.configureTab(ws10, styleValues);
        ws10.getRow('1').font = headerFont;
        ws10.autoFilter = 'A1:C1';
    }
    if (tabsRequired.psychCode == true) {
        global.ws34 = workbook.addWorksheet('Psych Codes');
        psychCodeTab.configureTab(ws34, styleValues);
        ws34.getRow('1').font = headerFont;
        ws34.autoFilter = 'A1:F1';
    }
    if (tabsRequired.implementationNetwork == true) {
        global.ws35 = workbook.addWorksheet('Implementation Network');
        implementationNetworkTab.configureTab(ws35, styleValues);
        ws35.getRow('1').font = headerFont;
        ws35.autoFilter = 'A1:H1';
    }
    if (tabsRequired.authorizationReferalDetails == true) {
        global.ws9 = workbook.addWorksheet('Authorization Referral Group');
        authorizationReferalGroupTab.configureTab(ws9, styleValues);
        ws9.getRow('1').font = headerFont;
        ws9.autoFilter = 'A1:O1';
    }
    if (tabsRequired.serviceAreaListDetails == true) {
        global.ws56 = workbook.addWorksheet('Service Area List');
        serviceAreaListTab.configureTab(ws56, styleValues);
        ws56.getRow('1').font = headerFont;
        ws56.autoFilter = 'A1:B1';
    }
    if (tabsRequired.serviceAreaDetails == true) {
        global.ws5 = workbook.addWorksheet('Service Area');
        serviceAreaTab.configureTab(ws5, styleValues);
        ws5.getRow('1').font = headerFont;
        ws5.autoFilter = 'A1:H1';
    }
    if (tabsRequired.lISPremiumDetails == true) {
        global.ws4 = workbook.addWorksheet('LIS Premium');
        lisPremiumTab.configureTab(ws4, styleValues);
        ws4.getRow('1').font = headerFont;
        ws4.autoFilter = 'A1:K1';
    }
    /*if (tabsRequired.businessCategoryDetails == true) {
        global.ws57 = workbook.addWorksheet('Business Category');
        businessCategoryTab.configureTab(ws57, styleValues);
        ws57.getRow('1').font = headerFont;
        ws57.autoFilter = 'A1:B1';
    }*/

    if (tabsRequired.medicalCostShareDetails == true) {
        global.ws3 = workbook.addWorksheet('Medical Cost Share');
        medicalCostShareTab.configureTab(ws3, styleValues);
        ws3.getRow('1').font = headerFont;
        ws3.autoFilter = 'A1:AC1';
    }
    if (tabsRequired.medicalBenifitsWaiversDetails == true) {
        global.ws15 = workbook.addWorksheet('Medical Waiver');
        medicalBenifitsWaiversTab.configureTab(ws15, styleValues);
        ws15.getRow('1').font = headerFont;
        ws15.autoFilter = 'A1:H1';
        }
    
    if (tabsRequired.medicalBeniftsLimitsExclusionDetails == true) {
        global.ws14 = workbook.addWorksheet('Medical Limit');
        medicalBenifitsLimitsExclusionsTab.configureTab(ws14, styleValues);
        ws14.getRow('1').font = headerFont;
        ws14.autoFilter = 'A1:I1';
    }   
    

    if (tabsRequired.medicalBenifitsMeberCostDetails == true) {
        global.ws16 = workbook.addWorksheet('Medical Member Cost');
        medicalBenifitsMemberCostsTab.configureTab(ws16, styleValues);
        ws16.getRow('1').font = headerFont;
        ws16.autoFilter = 'A1:I1';
    }

    if (tabsRequired.subPackageListDetails == true) {
        global.ws7 = workbook.addWorksheet('Sub Package List');
        subPackageListTab.configureTab(ws7, styleValues);
        ws7.getRow('1').font = headerFont;
        ws7.autoFilter = 'A1:Q1';
    }

    if (tabsRequired.subPackageBenifitsDetails == true) {
        global.ws8 = workbook.addWorksheet('Sub Package Benefits');
        if(envName =='Dev' || envName =='SIT' || envName =='QA'){
        subPackageBenifitsTab.configureTab(ws8, styleValues);
        }else{
        subPackageBenifitsTab.configureTab1(ws8, styleValues);
        }
        ws8.getRow('1').font = headerFont;
        ws8.autoFilter = 'A1:P1';
    }
    if (tabsRequired.subPackageBenifitLimitsDetails == true) {
        global.ws11 = workbook.addWorksheet('Sub Package Limit');
        subPackageBenifitLimitsTab.configureTab(ws11, styleValues);
        ws11.getRow('1').font = headerFont;
        ws11.autoFilter = 'A1:M1';
    }
    if (tabsRequired.subPackageBenifitTransportationsDetails == true) {
        global.ws32 = workbook.addWorksheet('Sub Package Transportation');
        subPackageTransportationTab.configureTab(ws32, styleValues);
        ws32.getRow('1').font = headerFont;
        ws32.autoFilter = 'A1:K1';
    }
    if (tabsRequired.subPackageMemberCostDetails == true) {
        global.ws12 = workbook.addWorksheet('Sub Package Member Cost');
        subPackageMemberCostsTab.configureTab(ws12, styleValues);
        ws12.getRow('1').font = headerFont;
        ws12.autoFilter = 'A1:J1';
    }
    if (tabsRequired.subPackagePBPNote == true) {
        global.ws36 = workbook.addWorksheet('Sub Package PBP Note');
        subPackagePBPNoteTab.configureTab(ws36, styleValues);
        ws36.getRow('1').font = headerFont;
        ws36.autoFilter = 'A1:J1';
    }   
    if (tabsRequired.pharmacyPackageDetails == true) {
        global.ws6 = workbook.addWorksheet('Pharmacy Package');
        pharmacyPackageTab.configureTab(ws6, styleValues);
        ws6.getRow('1').font = headerFont;
        ws6.autoFilter = 'A1:J1';
    }
    if (tabsRequired.pharmacyPackageDeductibleDetails == true) {
        global.ws51 = workbook.addWorksheet('Pharmacy Deductible Setup');
        pharmacyPackageDeductibleTab.configureTab(ws51, styleValues);
        ws51.getRow('1').font = headerFont;
        ws51.autoFilter = 'A1:J1';
    }
    if (tabsRequired.pharmacyPackageAdultACIPVaccineBenefitDetails == true) {
        global.ws59 = workbook.addWorksheet('Adult ACIP Vaccine Benefit');
        pharmacyPackageAdultACIPVaccineBenefitTab.configureTab(ws59, styleValues);
        ws59.getRow('1').font = headerFont;
        ws59.autoFilter = 'A1:H1';
    }
    if (tabsRequired.pharmacyPackageExcludedDrugsDetails == true) {
        global.ws13 = workbook.addWorksheet('Pharmacy Excluded Drug');
        pharmacyPackageExcludedDrugsTab.configureTab(ws13, styleValues);
        ws13.getRow('1').font = headerFont;
        ws13.autoFilter = 'A1:F1';
    }
    if (tabsRequired.pharmacyPackageBenefitDetails == true) {
        global.ws50 = workbook.addWorksheet('Pharmacy Benefit');
        pharmacyPackageBenefitTab.configureTab(ws50, styleValues);
        ws50.getRow('1').font = headerFont;
        ws50.autoFilter = 'A1:K1';
    }
   
    if (tabsRequired.planMemberCostsDetails == true) {
        global.ws58 = workbook.addWorksheet('Plan Member Costs');
        planMemberCostsTab.configureTab(ws58, styleValues);
        ws58.getRow('1').font = headerFont;
        ws58.autoFilter = 'A1:F1';
    }

    if (tabsRequired.planMemberCostDetails == true) {
        global.ws2 = workbook.addWorksheet('Plan Member Cost');
        planMemberCostTab.configureTab(ws2, styleValues);
        ws2.getRow('1').font = headerFont;
        ws2.autoFilter = 'A1:I1';
    }
  
    if (tabsRequired.SPAPProgramDetails == true) {
        global.ws20 = workbook.addWorksheet('SPAP Program Details');
        SPAPProgramDetailsTab.configureTab(ws20, styleValues);
        ws20.getRow('1').font = headerFont;
        ws20.autoFilter = 'A1:AC1';
    }
    if (tabsRequired.SPAPProgramContact == true) {
        global.ws21 = workbook.addWorksheet('SPAP Program Contact');
        SPAPProgramContactTab.configureTab(ws21, styleValues);
        ws21.getRow('1').font = headerFont;
        ws21.autoFilter = 'A1:G1';
    }
    if (tabsRequired.SPAPLISAudit == true) {
        global.ws22 = workbook.addWorksheet('SPAP LIS Audit');
        SPAPLISAuditTab.configureTab(ws22, styleValues);
        ws22.getRow('1').font = headerFont;
        ws22.autoFilter = 'A1:N1';
    }
   /* if (tabsRequired.customAttributesDetails == true) {
        global.ws19 = workbook.addWorksheet('Custom Attributes');
        customAttributesTab.configureTab(ws19, styleValues);
        ws19.getRow('1').font = headerFont;
        ws19.autoFilter = 'A1:B1';
    }*/
    if (tabsRequired.Tags == true) {
        global.ws19 = workbook.addWorksheet('Tags');
        TagsTab.configureTab(ws19, styleValues);
        ws19.getRow('1').font = headerFont;
        ws19.autoFilter = 'A1:C1';
    }
    if (tabsRequired.aboutDetails == true) {
        global.ws41 = workbook.addWorksheet('About');
        aboutTab.configureTab(ws41, styleValues);
        ws41.getRow('1').font = headerFont;
        ws41.autoFilter = 'A1:N1';
    }

    var filter = {
        'Product.PlanHeader.PlanYear': parseInt(planYear)
    };

       doMIMongoOperations(envName, planYear, tabsRequired, planIds,  async (result, err) => {
        if (result) {
            console.log('commiting test');
            var book = await workbook.commit()
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
};
 function doMIMongoOperations(envName, planYear, tabsRequired, planIds, callback) {
    logger.log.info('start Time is ', new Date());
    
    miConfig.loadConfig(envName, (gConfig, err) => {
        if (gConfig) {
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            // gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
            // "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&readPreference=primary";
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIExcelFile:340:url.....", url);
            logger.log.info('url is ' + url);

            MongoClient.connect(url)
                .then(async (db) => {
                    console.log('successfully...')
                    logger.log.info('Connected to MongoDb MI Server');

                    var dbHpas = db.db(gConfig.dbName);
                    var filter = {};
                    console.log("Plan IDs are : " + planIds);

                    if (planIds.length > 0) {
                        filter["Product.PlanHeader.PlanID"] = { '$in': planIds };
                    }
                    else {
                        filter['Product.PlanHeader.PlanYear'] = parseInt(planYear);
                    }
                    var plansProcessed = 0;
                    var totalPlans = 0;
                    const options = { PlanID: 1 };
                    var plansData = await dbHpas.collection("mi_products").countDocuments(filter, {})
                    totalPlans = plansData;
                    console.log('totalPlans inside', plansData);


                    var promiseCus = new Promise(async function (resolve, reject) {
                        const customAtt = await dbHpas.collection("mi_products_custom_attrs").find().toArray()

                        resolve(customAtt);
                    });

                    promiseCus.then((customAts) => {
                        var promisePlan = new Promise(async function (resolve, reject) {
                            const products = await dbHpas.collection("mi_products").find(filter).sort({ "_PlanIdentifier": 1 }).toArray()

                            resolve(products);

                        });


                        promisePlan.then((plans) => {
                            for (const product of plans) {
                                var tags = [];
                                for (const attr of customAts) {
                                    if (product.Product.PlanHeader.PlanID === attr.PlanID) {
                                        tags = attr.Tags;
                                        break;
                                    }

                                }

                                generateMIExcellStull(tabsRequired, product, tags, envName);
                                console.log('plan processed', product.Product.PlanHeader.PlanID);
                                plansProcessed++;
                                if (plansProcessed === totalPlans) {
                                    console.log('final finish');
                                    callback('success');
                                }

                            }

                        })
                    });

                });
        }
        else {
            logger.log.error('error occured is ' + err);
        }
    });
 }
 function generateMICustomAttributes(dbHpas) {
    var promise = new Promise(function (resolve, reject) {
        dbHpas.collection("mi_products_custom_attrs", function (err, result) {
            if (err) {
                console.log('error occured', err);
                resolve([]);
            }
            if (result) {
                console.log('result avaialbel is ', result);
                resolve(JSON.stringify(result.Tags));

            } else {
                console.log('result not avaialbel is ', result);
                resolve([]);
            }
        });
    });
}

function generateMIPlan(dbHpas,filter) {
    
    return new Promise(function (resolve, reject) {
        dbHpas.collection("mi_products").find(filter, function (err, result) {
            if (err) {
                console.log('error occured', err);
                //resolve([]);
            }
            if (result) {
                console.log('result avaialble is ', result);
                //resolve(JSON.stringify(result.Tags));

            } else {
                console.log('result not avaialble is ', result);
                //resolve([]);
            }
        });
    });
}

async function getData(dbHpas,filter){
    planAttr=await generateMIPlan(dbHpas.filter);
    customAttr= await generateMICustomAttributes(dbHpas);
   return {
       plans: planAttr,
       customA:customAttr
   }
}
       function generateMIExcellStull(tabsRequired, MIPlan, tags, envName) {
        console.log(MIPlan)
        //console.log(tabsRequired)
        //console.log(tags)
        //MIPlan = JSON.stringify(MIPlan)
    if (tabsRequired.planHeaderDetails == true) {
        if (MIPlan.Product.PlanMemberCosts != undefined && MIPlan.Product.PlanMemberCosts != null) {
            planHeaderTab.loadRowData(ws1, MIPlan.Product.PlanHeader, MIPlan.Product.About, "Yes");
        } else {
            planHeaderTab.loadRowData(ws1, MIPlan.Product.PlanHeader, MIPlan.Product.About, "No");
        }

    }
    if (MIPlan.Product.PlanMemberCosts != undefined && MIPlan.Product.PlanMemberCosts != null) {
        if (tabsRequired.planMemberCostDetails == true) {
            planMemberCostTab.loadRowData(ws2, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PlanMemberCosts);
        }
        if (tabsRequired.planMemberCostsDetails == true) {
            planMemberCostsTab.loadRowData(ws58, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PlanMemberCosts);
        }
    }
    if (MIPlan.Product.MedicalPackageList != undefined && MIPlan.Product.MedicalPackageList != null) {
        
        if (tabsRequired.medicalCostShareDetails == true) {
            medicalCostShareTab.loadRowData(ws3, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.MedicalPackageList);
        }

        if (tabsRequired.medicalBenifitsMeberCostDetails == true) {
            medicalBenifitsMemberCostsTab.loadRowData(ws16, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.MedicalPackageList);
        }

        if (tabsRequired.medicalBeniftsLimitsExclusionDetails == true) {
            medicalBenifitsLimitsExclusionsTab.loadRowData(ws14, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.MedicalPackageList);
        }

       

        if (tabsRequired.medicalBenifitsWaiversDetails == true) {
            medicalBenifitsWaiversTab.loadRowData(ws15, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.MedicalPackageList);
        }
    }

    if (MIPlan.Product.PharmacyPackageList != undefined && MIPlan.Product.PharmacyPackageList != null) {
        if (tabsRequired.pharmacyPackageDetails == true) {
            pharmacyPackageTab.loadRowData(ws6, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PharmacyPackageList);
        }
        if (tabsRequired.pharmacyPackageBenefitDetails == true) {
            pharmacyPackageBenefitTab.loadRowData(ws50, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PharmacyPackageList);
        }
        if (tabsRequired.pharmacyPackageDeductibleDetails == true) {
            pharmacyPackageDeductibleTab.loadRowData(ws51, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PharmacyPackageList);
        }
        if (tabsRequired.pharmacyPackageAdultACIPVaccineBenefitDetails == true) {
            pharmacyPackageAdultACIPVaccineBenefitTab.loadRowData(ws59, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PharmacyPackageList);
        }
        if (tabsRequired.pharmacyPackageExcludedDrugsDetails == true) {
            pharmacyPackageExcludedDrugsTab.loadRowData(ws13, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PharmacyPackageList);
        }
    }

    if (MIPlan.Product.SubPackageList != undefined && MIPlan.Product.SubPackageList != null) {
        if (tabsRequired.subPackageListDetails == true) {
            subPackageListTab.loadRowData(ws7, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
        }
        if (tabsRequired.subPackageMemberCostDetails == true) {
            subPackageMemberCostsTab.loadRowData(ws12, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
        }
        if (tabsRequired.subPackageBenifitsDetails == true) {
            if(envName =='Dev' || envName =='SIT' || envName =='QA'){
            subPackageBenifitsTab.loadRowData(ws8, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
            }else{
                subPackageBenifitsTab.loadRowData1(ws8, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);    
            }
        }
        if (tabsRequired.subPackageBenifitLimitsDetails == true) {
            subPackageBenifitLimitsTab.loadRowData(ws11, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
        }
        if (tabsRequired.subPackageBenifitTransportationsDetails == true) {
            subPackageTransportationTab.loadRowData(ws32, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
        }
        if (tabsRequired.subPackagePBPNote == true) {
            subPackagePBPNoteTab.loadRowData(ws36, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SubPackageList);
        }
    }
//Added by KiranKumar Padi(KXP0380)- FR4.01 -SPAP List
    if (MIPlan.Product.SPAPLists != undefined && MIPlan.Product.SPAPLists != null) {
        if (tabsRequired.SPAPProgramDetails == true) {
            SPAPProgramDetailsTab.loadRowData(ws20, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SPAPLists);
        }
        if (tabsRequired.SPAPProgramContact == true) {
            SPAPProgramContactTab.loadRowData(ws21, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SPAPLists);
        }
        if (tabsRequired.SPAPLISAudit == true) {
            SPAPLISAuditTab.loadRowData(ws22, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.SPAPLists);
        }        
    }
    if (MIPlan.Product.LOB != undefined && MIPlan.Product.LOB != null && MIPlan.Product.LOB.MedicareIndividual != undefined && MIPlan.Product.LOB.MedicareIndividual != null) {
        if (tabsRequired.lISPremiumDetails == true) {
            lisPremiumTab.loadRowData(ws4, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.LISPremiums);
        }
        if (tabsRequired.serviceAreaListDetails == true) {
            serviceAreaListTab.loadRowData(ws56, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.ServiceAreaList);
        }

        if (tabsRequired.serviceAreaDetails == true) {
            serviceAreaTab.loadRowData(ws5, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.ServiceAreaList);
        }

        if (tabsRequired.medicareIndividual == true) {
            medicareIndividualTab.loadRowData(ws33, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual);
        }
        /*if (tabsRequired.businessCategoryDetails == true) {
            businessCategoryTab.loadRowData(ws57, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual);
        }*/

        if (tabsRequired.authorizationReferalDetails == true) {
            authorizationReferalGroupTab.loadRowData(ws9, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual);
        }

        if (tabsRequired.specialNeedsPlanDetails == true) {
            if (MIPlan.Product.LOB.MedicareIndividual.SpecialNeedsPlan != undefined && MIPlan.Product.LOB.MedicareIndividual.SpecialNeedsPlan != null) {
                specialNeedsPlanTab.loadRowData(ws17, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.SpecialNeedsPlan);
            }
        }
        if (tabsRequired.pfpInfo == true) {
            if (MIPlan.Product.PlanHeader.PFPInfo != undefined && MIPlan.Product.PlanHeader.PFPInfo != null) {
                PFPInfoTab.loadRowData(ws28, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.PlanHeader.PFPInfo);
            }
        }

        if (MIPlan.Product.LOB.MedicareIndividual.ImplementationArea != undefined && MIPlan.Product.LOB.MedicareIndividual.ImplementationArea != null) {
            if (tabsRequired.implementationAreaDetails == true) {
                implementationAreaTab.loadRowData(ws10, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.DrugPlanType, MIPlan.Product.LOB.MedicareIndividual.ContractPBP, MIPlan.Product.LOB.MedicareIndividual.ImplementationArea);
            }
            if (tabsRequired.psychCode==true){
                psychCodeTab.loadRowData(ws34, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.DrugPlanType, MIPlan.Product.LOB.MedicareIndividual.ContractPBP, MIPlan.Product.LOB.MedicareIndividual.ImplementationArea);
            }
            if (tabsRequired.implementationNetwork) {
                implementationNetworkTab.loadRowData(ws35, MIPlan.Product.PlanHeader.PlanID, MIPlan.Product.LOB.MedicareIndividual.DrugPlanType, MIPlan.Product.LOB.MedicareIndividual.ContractPBP, MIPlan.Product.LOB.MedicareIndividual.ImplementationArea);
            }
        }
    }
    if (tabsRequired.Tags == true) {
        try {
            if (tags) {
                for (const record of tags) {
                    TagsTab.loadRowData(ws19, MIPlan.Product.PlanHeader.PlanID, record);
                }
            }
        } catch (e) { console.log("error while generating the Tags data ", e) }

    }
    if (tabsRequired.aboutDetails == true) {
        if(MIPlan.Product.About != undefined && MIPlan.Product.About != null ){
            aboutTab.loadRowData(ws41, MIPlan);
        }
    }
}
var retreiveMIPlanYears = (envName, callback) => {
    miConfig.loadConfig(envName, (gConfig, err) => {
        if (gConfig) {
            console.log("connecting error is :::" +err);
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + ":" + gConfig.port + "/" +
            // gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
            // "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&readPreference=primary";
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIExcelFile:649:url.....", url);
           
            MongoClient.connect(url)
                .then(async (db) => {
                    console.log('successfully...')
                    logger.log.info('Successfully connected to MongoDb MI Server');
                var dbHpas = db.db(gConfig.dbName);
                var planYearData = await dbHpas.collection("mi_products").distinct('Product.PlanHeader.PlanYear')
                    
                    console.log(planYearData)
                    //console.log(result)
                    callback(planYearData);
                });
                
                
}
    })
}


var retreiveMIPlanIds = (planYear, envName, callback) => {
    miConfig.loadConfig(envName, (gConfig, err) => {
        if (gConfig) {
            const decipher = crypto.createDecipher('aes192', gConfig.messageKey);
            var decrypted = decipher.update(gConfig.encpass, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // var url = "mongodb://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            // gConfig.dbName + "?replicaSet=" + gConfig.replicaSet +
            // "&authSource="+ gConfig.authdbName + "&maxPoolSize=10&ssl=true&readPreference=primary";
            var url = "mongodb+srv://" + gConfig.userId + ":" + decrypted + "@" + gConfig.node + "/" +
            gConfig.dbName + "?authSource=" + gConfig.authdbName +  "&replicaSet=" + gConfig.replicaSet + "&retryWrites=true&w=majority" ; 
            console.log("generateMIExcelFile:686:url.....", url);
            MongoClient.connect(url)
                .then(async (db) => {
                    console.log('successfully...')
                    logger.log.info('Successfully connected to MongoDb MI Server');
                var dbHpas = db.db(gConfig.dbName);
                var planIDData = await dbHpas.collection("mi_products").distinct('Product.PlanHeader.PlanID', { 'Product.PlanHeader.PlanYear': parseInt(planYear) })
                    
                    console.log(planIDData)
                    //console.log(result)
                    callback(planIDData);
                });
        }
        else {
            callback(err);
        }
    });
}

module.exports.generateMIExcelFile = generateMIExcelFile;
module.exports.retreiveMIPlanYears = retreiveMIPlanYears;
module.exports.retreiveMIPlanIds = retreiveMIPlanIds;