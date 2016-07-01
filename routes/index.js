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
        User.getUserByUsername(username, function(err, user){
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
router.post('/auth', passport.authenticate('local', {failureRedirect: '/', failureFlash: true}), function(req, res){
    res.redirect('/main');
});



router.post('/register', function(req, res){
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var password_confirm = req.body.password_confirm;
    
    //Validation
    req.checkBody('username', 'First name is required').notEmpty();
    req.checkBody('firstname', 'Last name is required').notEmpty();
    req.checkBody('lastname', 'Username is required').notEmpty();
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
                        lastname: lastname,
                        firstname: firstname,
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

//Verify user is authenticated HERE:
function ensureAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    else {
        res.redirect('/');
    }
}

//Send user to password_reset view
router.get('/password_reset', function(req, res)
{
    res.render('password_reset', {errors: null}); 
});

//Process password reset form
router.post('/reset_pass', function(req, res)
{
    //Implement check to validate e-mail
    req.checkBody('email', 'Please enter a valid e-mail').isEmail();
    var errors = req.validationErrors();
    
    //Error handling
    if (errors)
    {
        console.log(errors);
        res.render('password_reset', {errors: errors});
    }
    
    
    //Code to process password reset
    User.find({email: req.body.email}, function(err, user){
    });
    
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
