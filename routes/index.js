var express = require('express');
var router = express.Router();


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
