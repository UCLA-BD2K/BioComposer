var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneWiki' });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'GeneWiki' });
});

// Process Log-In POST
router.post('/login', function(req, res){
    var msg = '<h1>Here are your login credentials</h1> <p>Username: ' + req.body.username + '</p> <p>Password: ' + req.body.password + '</p>';
    res.render('register', { username: req.body.username });
});

module.exports = router;
