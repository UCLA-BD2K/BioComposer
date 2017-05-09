//Austin Nasso - August, 2016

//Dependencies
var express = require('express');
var fs = require('fs'); //for filesystem
var exec = require('child_process').exec; //for executing commands
var router = express.Router();
var WikiFile = require('../models/file.js');

//Interface
function editorController(){
    var self = this;
    
    //Locking mechanism:
    //Basically as each request comes in a checkLock method is added to the server's stack
    //which contains the data, req, and res objects for each respective request. 
    //If the fileLock is set to true then no other checkLock method is able to 'convert' data
    //which prevents multiple users from writing to /tmp/ directories at the same time. 
    //As more users use this platform, it may be beneficial to have multiple files and locks.
    this.fileLock = false;
    
    //Helper functions
    //This function uses the PANDOC program to convert the posted html to Wiki Mark Up
    this.convert = function(req, res) {return this._convert(self, req, res); };
    
    //Editor methods
    //Saves the HTML mark up from CKEditor and the citations objects to MongoDB
    this.save = function(req, res) {return self._save(self, req, res); };
    
    //Deletes a file from the MongoDB database
    this.deleteFile = function(req, res) {return self._deleteFile(self, req, res); };
    
    //Queries the existing files and sends to the file navigator
    this.getFiles = function(req, res) {return self._getFiles(self, req, res); };
    
    //Loads HTML Markup from Mongo into CKEditor
    this.openFile = function(req, res) {return self._openFile(self, req, res); };
    
    //Ensures that one person at time is writing to the temporary file on disk and effectively creates a queue
    this.checkLock = function(req, res) {return self._checkLock(self, req, res); };
    
    //Converts downloaded wiki article to HTML
    this.wiki2HTML = function(req, res) {return self._wiki2HTML(self, req, res); };
}

//Implementation
editorController.prototype._convert = function(self, req, res){
    console.log("Convert called");
    var decoded = decodeURIComponent(req.body.text);
	self.fileLock = true;
    fs.writeFile("/tmp/test.html", decoded, function(err) {
        if(err) {
            return console.log(err);
        }
        
        console.log("no err");

        //File saved successfully
        var cmd = "pandoc /tmp/test.html -f html -t MediaWiki -s -o /tmp/test";
        exec(cmd, function(error, stdout, stderr) {
            console.log("error: " + error + "\nstdout: " + stdout + "\nstderr" + stderr);
            fs.readFile('/tmp/test', function(err, data) {
                console.log("err: " + err);
                console.log("data: " + data);
                res.send(data);
                self.fileLock = false;
                
            })
        });
        
    }); 
};

editorController.prototype._save = function(self, req, res){
    console.log("Save called");
    console.log(JSON.stringify(req.body));
	var contents = req.body.contents;
    var title = req.body.title;
    var citations = req.body.citations;
    var dateModified = Date.now();
    var dateCreated = dateModified;
    var authors = [req.user.id];
    var type = req.body.type;
    
    //Check if file exists
    WikiFile.find({title: title}, function(err, file){
        //Update
        if (!file.length == 0)
        {
            console.log("Exists");
            authors = file[0].authors;
            var addAuthor = true;
            for (var x=0; x<file[0].authors.length; x++)
            {
                if (req.user.id == file[0].authors[x])
                    addAuthor = false;
            }
            
            //Current author not on the list
            if (addAuthor)
            {
                authors.push(req.user.id);
                file[0].authors = authors;
            }
            
            if (req.body.overwrite == "true") { // Only update type if user overwrites file
                file[0].type = type;
                console.log("overwriting type")
            }
            file[0].contents = contents;
            file[0].date_modified = dateModified;
            file[0].citationObjects = citations;
            file[0].save();
            res.send("WikiFile successfully saved!");
        }
        
        //Create document
        else
        {
            console.log("New article");
            var newArticle = new WikiFile({
                title: title,
                date_created: dateCreated,
                date_modified: dateModified,
                authors: authors,
                contents: contents,
                citationObjects: citations,
                type: type
            });
            
            newArticle.save();
            res.send("WikiFile successfully created!");
        }            
    }); 
};

editorController.prototype._deleteFile = function(self, req, res){
	var title = req.body.title;
    WikiFile.find({ title:title }).remove().exec();
    res.send("true");
};

editorController.prototype._getFiles = function(self, req, res){
	var fileNames = [];
    var user = req.user.id;
    console.log(req.body.type);
    if (req.body.sendFileNames == "true")
    {
        WikiFile.find({}, function(err, files){
            if (err)
            {
                console.log(err);
                throw err;
            }
            for (var x=0; x<files.length; x++)
            {
                var fileInfo = {
                    title: files[x].title, 
                    date_created: files[x].date_created, 
                    date_modified: files[x].date_modified,
                    type: files[x].type
                }
                fileNames.push(fileInfo);
            }
            
            res.send(JSON.stringify(fileNames));
        });
    }
};

editorController.prototype._openFile = function(self, req, res){
	WikiFile.find({title: req.body.title}, function(err, file){
        if (err)
            throw err;
        
        if (file.length > 0)
            res.send(file[0]);
    });
};

editorController.prototype._checkLock = function(self, req, res){
    if (self.fileLock == true)
    {
        setTimeout(function(){checkLock(req, res)}, 50);
        return;
    }
    else
        self.convert(req, res);
    
    console.log("check lock");
};

editorController.prototype._wiki2HTML = function(self, req, res){
    console.log("ENTER HERE");
    var text = decodeURIComponent(req.body.object.text);
    
    //Grab citations
    //var citations = req.body.object.citations;
    var tmpFile = req.user.id;
    
    fs.writeFile("/tmp/" + tmpFile + ".md", text, function(err) {
        if(err) {
            return console.log(err);
        }
        
        console.log("no err");

        //File saved successfully
        var cmd = "pandoc /tmp/" + tmpFile + ".md" + " -f MediaWIki -t HTML -s -o /tmp/" + tmpFile + ".html";
        exec(cmd, function(error, stdout, stderr) {
            fs.readFile("/tmp/" + tmpFile + ".html", function(err, data) {
                console.log(data);
                data = String(data);
                
                //Replace |sup| with <sup> tags
                var reg = /\|sup data-id='([0-9]+)'\|\[([0-9]+)\]\|\/sup\|/g;
                data = data.replace(reg, "<sup data-id='$1'>[$2]</sup>");
                
                res.send(data);
                
                //Clean up
                exec("rm /tmp/" + tmpFile + ".html");
                exec("rm /tmp/" + tmpFile + ".md");
            })
        });
        
    }); 
};


//Export
module.exports = new editorController();