var express = require('express');
var router = express.Router();

var user = require('../models/user.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

// Process Log-In POST
router.post('/login', function(req, res){
    var msg = '<h1>Here are your login credentials</h1> <p>Username: ' + req.body.username + '</p> <p>Password: ' + req.body.password + '</p>';
    res.render('register', { username: req.body.username });
});

router.post('/register', function(req, res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var password_confirm = req.body.password_confirm;
    
    //Validation
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('email', 'E-mail is required').notEmpty();
    req.checkBody('email', 'E-mail is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password_confirm', 'Passwords don\'t match').equals(password);
    
    var errors = req.validationErrors();
    
    //Error handling
    if (errors)
    {
        res.render('index', {errors: errors, reg_status: "error"});
    }
    else
    {
        
        //If username is not taken and e-mail doesn't exist
        var newUser = new user({
            username: username,
            email: email,
            password: password
        });
        
        user.createUser(newUser, function(err, user)
        {
            if (err) throw err;
            console.log(user);
        });
        
        console.log('sucess_msg', 'You are registered and can now log in.');
        res.render('index', {reg_status: "success"});
    }
});

module.exports = router;
