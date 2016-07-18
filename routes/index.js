var express = require('express');
var fs = require('fs'); //for filesystem
var exec = require('child_process').exec; //for executing commands
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

router.get('/test', function(req, res, next) {
  res.render('editor');
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
}

//function to perform system calls and convert
function convert(decoded, req, res)
{
    fileLock = true;
    fs.writeFile("/tmp/test.html", decoded, function(err) {
        if(err) {
            return console.log(err);
        }

        //File saved successfully
        var cmd = "pandoc /tmp/test.html -f html -t MediaWiki -s -o /tmp/test";
        exec(cmd, function(error, stdout, stderr) {
            fs.readFile('/tmp/test', function(err, data) {
                res.send(data);
                fileLock = false;
            })
        });
        
    }); 
}

router.post('/convert', function(req, res){
    var decoded = decodeURIComponent(req.body.text);
    checkLock(decoded, req, res);
    
});

//---------- RESTRICTED USER ONLY ACCESS AREA -------------//

router.get('/main', ensureAuthenticated, function(req, res)
{
    res.render('main');
});

router.get('/logout', ensureAuthenticated, function(req, res)
{
    req.logout();
    res.redirect('/'); 
});



router.get('/account', ensureAuthenticated, function(req, res)
{
    res.render('account_settings'); 
});


module.exports = router;
