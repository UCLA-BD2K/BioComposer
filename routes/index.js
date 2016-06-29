var express = require('express');
var router = express.Router();
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var User = require('../models/user.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'GeneWiki', reg_status: "none" });
});

//Authenticating user
passport.use(new localStrategy(
    function(username, password, done){
        User.getUserbyUsername(username, function(err, user){
            if (err) throw err;
            if (!user)
                return done(null, false, {message: "User not found."});
            User.comparePassword(password, user.password, function(err, isMatch){
                if (err) throw err;
                if (isMatch){
                    return done (null,user);
                }
                else {
                    return done(null, false, {message: "Incorrect password."});
                }
            });
        });
    }));
        

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// Process Log-In POST
router.post('/login', passport.authenticate('local'), function(req, res){
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
        User.find({username: username}, function(err, user){
            if (err) throw err;
            
            //Username not taken
            console.log(user);
            if (user.length==0)
            {
                User.find({email: email}, function(err, user){
                    //If username is not taken and e-mail doesn't exist
                    if (user.length==0)
                    {
                        var newUser = new User({
                        username: username,
                        email: email,
                        password: password
                        });

                        User.createUser(newUser, function(err, user)
                        {
                        if (err) throw err;
                        console.log(user);
                        });

                        console.log('sucess_msg', 'You are registered and can now log in.');
                        res.render('index', {reg_status: "success"});
                    }
                    else
                        res.render('index', {reg_status: "email_exists"});
                });
            }
            else
                res.render('index', {reg_status: "user_exists"});
            
        });
        
    }
});

module.exports = router;
