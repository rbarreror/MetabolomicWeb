// Import libraries
const fs = require('fs');
const {spawn} = require('child_process');
const path = require('path');

// Functions used to execute the workflow

paramObjectsCreator = function(paramJSON) {

    // Tagger setting
    var taggerParams = {};

    taggerParams['HalogenatedRegex'] = paramJSON.HalogenatedRegex;
    taggerParams['OutputName'] = paramJSON.Tagger_OutputName;
    taggerParams['OutputColumns'] = paramJSON.Tagger_OutputColumns;
    taggerParams['Food'] = "";
    taggerParams['Drug'] = "";
    taggerParams['MicrobialCompound'] = "";
    taggerParams['Halogenated'] = "";
    
    allParams = Object.keys(paramJSON);

    if (allParams.indexOf('Food') != -1){
        taggerParams['Food'] = "True";
    }
        
    if (allParams.indexOf('Drug') != -1){
        taggerParams['Drug'] = "True";
    }

    if (allParams.indexOf('MicrobialCompound') != -1){
        taggerParams['MicrobialCompound'] = "True";
    }
        
    if (allParams.indexOf('Halogenated') != -1){
        taggerParams['Halogenated'] = "True";
    }

    // Mod setting
    var modParams = {};

    modParams['RemoveRow'] = paramJSON.RemoveRow;
    modParams['Separator'] = paramJSON.Separator;
    modParams['AminoAcidSeparator'] = paramJSON.AminoAcidSeparator;
    modParams['OutputName'] = paramJSON.Mod_OutputName;
    modParams['OutputColumns'] = paramJSON.Mod_OutputColumns;

    // Table setting
    var tableParams = {};

    tableParams['ComparedColumns'] = paramJSON.ComparedColumns;
    tableParams['ConservedColumns'] = paramJSON.ConservedColumns;
    tableParams['OutputName'] = paramJSON.Table_OutputName;
    tableParams['OutputColumns'] = paramJSON.Table_OutputColumns;

    // FeatureInfo setting
    var featureInfoParams = {};

    featureInfoParams['N_Digits'] = paramJSON.N_Digits;
    featureInfoParams['OutputName'] = paramJSON.FeatureInfo_OutputName;
    featureInfoParams['OutputColumns'] = paramJSON.FeatureInfo_OutputColumns;

    // Join all parameters in one object
    var allModulesParams = {Tagger: taggerParams, Mod: modParams, Table: tableParams, FeatureInfo: featureInfoParams};
    
    return allModulesParams;
}


executeWorkFlow = function(allModulesParams, workflow, jobID, files) {

    jobDir = path.join(__dirname, 'public', 'results', jobID);

    fs.exists(jobDir, function (exists) {

        if (!exists){
            fs.mkdir(jobDir, function(err) {
                if (err) throw err;
                
                infile_user = path.join(jobDir, files['inputFile']['name']);

                fs.copyFile(files['inputFile']['path'], infile_user, function (err){
                    if (err) throw err;

                    console.log(jobDir + " directory successfully created");
                    executeModules(allModulesParams, workflow, jobID, infile_user, files);            
                })

            })
        }
    })
}


executeModules = function(allModulesParams, workflow, jobID, infile_user, files) {

    numToMod = {1: 'Tagger', 2: 'Mod', 3: 'Table', 4: 'FeatureInfo'}
    infile_feature_info = "";
    workflow_string = workflow.toString().replace(/,/g, "");
    jobDir = path.dirname(infile_user);

    for (moduleNum of workflow) {
        moduleName = numToMod[moduleNum];

        switch (moduleName) {
            
            case "Tagger":
                outfile = iniTaggerCreator(allModulesParams[moduleName], jobID, infile_user);
                break;
            
            case "Mod":
                outfile = iniModCreator(allModulesParams[moduleName], jobID, infile_user);
                break;

            case "Table":
                outfile = iniTableCreator(allModulesParams[moduleName], jobID, infile_user);
                break;
            
            case "FeatureInfo":
                outfile = iniFeatureInfoCreator(allModulesParams[moduleName], jobID, infile_user, files);
                infile_feature_info = path.join(jobDir, files["FeatureInfo_file"]["name"]);
                fs.copyFile(files["FeatureInfo_file"]["path"], infile_feature_info, function (err) {
                    if (err) throw err;
                })
                break;
        }
    }

    script = path.join(__dirname, 'pyModules', 'integrator.sh');
    console.log(script);

    const bash = spawn('bash', [script, workflow_string, infile_user, jobDir, jobID, infile_feature_info]);

    bash.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    bash.stderr.on(`data`, (data) => {
        console.error(`stderr: ${data}`);
    });

    bash.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });


}


iniTaggerCreator = function (taggerParams, jobID, infile) {

    if (taggerParams['OutputName'] == "") {
        outfile = "tagged_" + path.basename(infile);
    } else {
        outfile = taggerParams['OutputName']
    }

    iniPath = path.join(__dirname, 'public', 'results', jobID, 'tagger.ini');

    iniContent = "[TagSelection]"
    iniContent += "\nFood = " + taggerParams['Food'];
    iniContent += "\nDrug = " + taggerParams['Drug'];
    iniContent += "\nMicrobialCompound = " + taggerParams['MicrobialCompound'];
    iniContent += "\nHalogenated = " + taggerParams['Halogenated'];

    iniContent += "\n[Parameters]";
    iniContent += "\nOutputName = " + outfile;
    iniContent += "\nOutputColumns = " + taggerParams['OutputColumns'];
    iniContent += "\nHalogenatedRegex = " + taggerParams['HalogenatedRegex'];

    fs.writeFile(iniPath, iniContent, function (err) {
        if (err) throw err;
        console.log('tagger.ini saved');
    })

    return iniPath;
}


iniModCreator = function (modParams, jobID, infile) {

    if (modParams['OutputName'] == "") {
        outfile = "mod_" + path.basename(infile);
    } else {
        outfile = taggerParams['OutputName']
    }

    iniPath = path.join(__dirname, 'public', 'results', jobID, 'mod.ini');

    iniContent = "[Parameters]";
    iniContent += "\nOutputName = " + outfile;
    iniContent += "\nOutputColumns = " + modParams['OutputColumns'];
    iniContent += "\nSeparator = " + modParams['Separator'];
    iniContent += "\nAminoAcidSeparator = " + modParams['AminoAcidSeparator'];
    iniContent += "\nRemoveRow = " + modParams['RemoveRow'];

    fs.writeFile(iniPath, iniContent, function (err) {
        if (err) throw err;
        console.log('mod.ini saved');
    })

    return iniPath;
}


iniTableCreator = function (tableParams, jobID, infile) {

    if (tableParams['OutputName'] == "") {
        outfile = "table_" + path.basename(infile);
    } else {
        outfile = tableParams['OutputName']
    }

    iniPath = path.join(__dirname, 'public', 'results', jobID, 'table.ini');

    iniContent = "[Parameters]";
    iniContent += "\nOutputName = " + outfile;
    iniContent += "\nOutputColumns = " + tableParams['OutputColumns'];
    iniContent += "\nComparedColumns = " + tableParams['ComparedColumns'];
    iniContent += "\nConservedColumns = " + tableParams['ConservedColumns'];

    fs.writeFile(iniPath, iniContent, function (err) {
        if (err) throw err;
        console.log('table.ini saved');
    })

    return iniPath;
}


iniFeatureInfoCreator = function (featureInfoParams, jobID, infile) {

    if (featureInfoParams['OutputName'] == "") {
        outfile = "info_" + path.basename(infile);
    } else {
        outfile = featureInfoParams['OutputName']
    }

    iniPath = path.join(__dirname, 'public', 'results', jobID, 'featureInfo.ini');

    iniContent = "[Parameters]";
    iniContent += "\nOutputName = " + outfile;
    iniContent += "\nOutputColumns = " + featureInfoParams['OutputColumns'];
    iniContent += "\nN_Digits = " + featureInfoParams['N_Digits'];

    fs.writeFile(iniPath, iniContent, function (err) {
        if (err) throw err;
        console.log('featureInfo.ini saved');
    })

    return iniPath;
}


// Export module
module.exports.paramObjectsCreator = paramObjectsCreator;
module.exports.executeWorkFlow = executeWorkFlow;