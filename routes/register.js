var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var bcrypt = require('bcryptjs');
var sha1 = require('sha1');
var passport = require('passport');

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
                        var hash_val = sha1(Math.floor(Date.now() + Math.random() * 1000));
                        
                        var newUser = new User({
                        lastname: lastname,
                        firstname: firstname,
                        username: username,
                        email: email,
                        password: password,
                        reset_hash: hash_val.toString()
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
