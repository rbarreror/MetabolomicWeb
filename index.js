// Import libraries and create main instances
const fs = require('fs');
const {spawn} = require('child_process');
const path = require('path');
const formidable = require('formidable');

const workflowExecution = require(path.join(__dirname, 'workflowExecution.js'))

const express = require('express');
const app = express();
const port = 8080;



const { table } = require('console');


// set static files to be used
app.use(express.static("public"));

// routes

// TurboPutative workflow handling
app.post('/turboputative.html', function(req, res) {

    const form = formidable({ multiples: true });

    form.parse(req, function (err, fields, files) {

        if (err) throw err;

        // run workflow
        allModulesParams = workflowExecution.paramObjectsCreator(fields);
        workflow = fields["workflow"].split("");
        jobID = fields["jobID"];
        workflowExecution.executeWorkFlow(allModulesParams, workflow, jobID, files);

        // send "waiting" page to the client
        fs.readFile(path.join(__dirname, "public", "putativejob.html"), "utf-8", function (err, html) {
            if (err) throw err;

            html = html.replace("###INSERT_JOB_ID###", jobID);
            html = html.replace("###INSER_JOB_STATUS###", 'Processing');

            //res.writeHead(200, {'Content-type':'text/plain'});
            res.send(html);
            res.end();
        })

        // console.log(allModulesParams);
        // console.log(JSON.stringify({ fields, files }, null, 2));
    })

})

// Reloading handling
app.get('/turboputative.html/:id', function (req, res) { 

    var jobID = req.params.id;

    fs.exists(path.join(__dirname, 'public', 'results', jobID, 'TurboPutativeResults.zip'), function(exists){
        if (!exists){
            // send "waiting" page to the client
            fs.readFile(path.join(__dirname, "public", "putativejob.html"), "utf-8", function (err, html) {
                if (err) throw err;

                html = html.replace("###INSERT_JOB_ID###", jobID);
                html = html.replace("###INSER_JOB_STATUS###", 'Processing');

                //res.writeHead(200, {'Content-type':'text/plain'});
                res.send(html);
                res.end();
        })
        } else {
            fs.readFile(path.join(__dirname, "public", "putativejob.html"), "utf-8", function (err, html) {
                if (err) throw err;

                html = html.replace("###INSERT_JOB_ID###", jobID);
                html = html.replace("###INSER_JOB_STATUS###", 'Finished');
                html = html.replace("###INSERT_ZIP_PATH###", path.join('..', 'results', jobID, 'TurboPutativeResults.zip'));

                containerDownloadDisplay = "document.getElementById('containerDownload').style.display = 'block'"
                html = html.replace("//###INSERT_DISPLAY_containerDownload###", containerDownloadDisplay);

                html = html.replace(/setTimeout.*\n/g, "");

                //res.writeHead(200, {'Content-type':'text/plain'});
                res.send(html);
                res.end();
            })
        }
    })

})

// run server
app.listen(port, function () {
    console.log('Server listening at port ' + port);
})
