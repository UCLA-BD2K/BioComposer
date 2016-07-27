var express = require('express');
var fs = require('fs'); //for filesystem
var exec = require('child_process').exec; //for executing commands
var router = express.Router();

//Mongo for Files
var WikiFile = require('../models/file.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

//Verify user is authenticated HERE:
function ensureAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    else {
        res.redirect('/');
    }
}

//Temp location: Process HTML to Wiki Conversion
var fileLock = false;

//Locking mechanism:
//Basically as each request comes in a checkLock method is added to the server's stack
//which contains the data, req, and res objects for each respective request. 
//If the fileLock is set to true then no other checkLock method is able to 'convert' data
//which prevents multiple users from writing to /tmp/ directories at the same time. 
//As more users use this platform, it may be beneficial to have multiple files and locks.
function checkLock(data, req, res)
{
    if (fileLock == true)
    {
        setTimeout(function(){checkLock(data, req, res)}, 50);
        return;
    }
    else
        convert(data, req, res);
    
    console.log("check lock");
}

//function to perform system calls and convert
function convert(decoded, req, res)
{
    fileLock = true;
    fs.writeFile("/tmp/test.html", decoded, function(err) {
        if(err) {
            return console.log(err);
        }
        
        console.log("no err");

        //File saved successfully
        var cmd = "pandoc /tmp/test.html -f html -t MediaWiki -s -o /tmp/test";
        exec(cmd, function(error, stdout, stderr) {
            fs.readFile('/tmp/test', function(err, data) {
                console.log(data);
                res.send(data);
                fileLock = false;
                
            })
        });
        
    }); 
}

//---------- RESTRICTED USER ONLY ACCESS AREA -------------//

router.get('/main', ensureAuthenticated, function(req, res)
{
    res.render('editor');
});

router.get('/logout', ensureAuthenticated, function(req, res)
{
    req.logout();
    res.redirect('/'); 
});

//Temp location
router.post('/convert', ensureAuthenticated, function(req, res){
    var decoded = decodeURIComponent(req.body.text);
    console.log("posted");
    checkLock(decoded, req, res);
    
});

//Temp location
router.post('/save', ensureAuthenticated, function(req, res){
    var contents = req.body.contents;
    var title = req.body.title;
    var citations = req.body.citations;
    var dateModified = Date.now();
    var dateCreated = dateModified;
    var authors = [req.user.id];
    
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
                citationObjects: citations
            })
            
            newArticle.save();
            res.send("WikiFile successfully created!");
        }            
            
    });
    
    
});

router.get('/account', ensureAuthenticated, function(req, res)
{
    res.render('account_settings'); 
});


module.exports = router;
