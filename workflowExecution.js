// Import libraries
const fs = require('fs');
const {spawn} = require('child_process');
const path = require('path');

// Functions used to execute the workflow

paramObjectsCreator = function(paramJSON) {

    var taggerParams = paramJSON.TaggerParams;
    var modParams = paramJSON.ModParams;
    var tableParams = paramJSON.TableParams;
    var featureInfoParams = paramJSON.FeatureInfoParams;
    
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
                iniWriter(allModulesParams[moduleName], jobDir, "tagger.ini");
                break;
            
            case "Mod":
                iniWriter(allModulesParams[moduleName], jobDir, "mod.ini");
                break;

            case "Table":
                iniWriter(allModulesParams[moduleName], jobDir, "table.ini");
                break;
            
            case "FeatureInfo":
                outfile = iniWriter(allModulesParams[moduleName], jobDir, "featureInfo.ini");
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

iniWriter = function (iniString, jobDir, module) {
    
    iniWrite = iniString.replace(/###/g, '\n');

    filePath = path.join(jobDir, module);
    fs.writeFile(filePath, iniWrite, function (err) {
        if (err) throw err;

        console.log(module + " was saved");
    })
}

// Export module
module.exports.paramObjectsCreator = paramObjectsCreator;
module.exports.executeWorkFlow = executeWorkFlow;