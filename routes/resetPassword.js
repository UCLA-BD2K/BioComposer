var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var bcrypt = require('bcryptjs');
var sha1 = require('sha1');

// ----------- SET UP E-MAIL MAILER FOR PASSWORD RESET ----------- //
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport('smtps://genewikidev1%40gmail.com:genewikirox@smtp.gmail.com');

//Send user to password_reset view
router.get('/password_reset', function(req, res)
{
    res.render('password_reset'); 
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
        req.flash('error_msg', errors[0].msg)
        res.redirect('/password_reset');
    }
    
    //E-mail Sent
    else{
        
        //Create reset_hash, store in database and send e-mail
        var query = {email: req.body.email};
        var hash_val = sha1(Math.floor(Date.now() + Math.random() * 1000));
        var mailOptions={
        to : req.body.email,
        subject : "Reset Password",
        text : "Click the following link to reset your password: /change_password?email=" + encodeURIComponent(req.body.email) + "&hash=" + encodeURIComponent(hash_val.toString())
        }
        User.update(query, {reset_hash: hash_val}, function(){
            //Actually send mail
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                        console.log(error);
                        res.end("error");
                 }
                else{
                        req.flash('success_msg', 'E-mail sent to ' + req.body.email);
                        res.redirect('/password_reset');
                }
            });
            
        });
        
    }
    
});

//When link is clicked in e-mail -- this grants access to the change password page
router.get('/change_password', function(req, res){
    //generate Mongo query from link    
    var query = {email: req.query.email, reset_hash: req.query.hash};
    var hash_val = sha1(Math.floor(Date.now() + Math.random() * 1000));
    User.update(query, {reset_hash: hash_val}, function(err, writeObj){
        if (err) throw err; 
        if (writeObj.nModified) //sucess
        {
            req.flash('success_msg', 'Correct link - it works');
            res.render('change_password', {email: req.query.email, hash: hash_val});
        }
        else //fail
        {
            req.flash('error_msg', 'Invalid link. Try re-sending e-mail.');
            res.redirect('/password_reset');
        }
    });
});

//When password change is submitted
router.post('/submit_password_change', function(req, res){
    var query = {email: req.body.email, reset_hash: req.body.hash};
    var hash_val = sha1(Math.floor(Date.now() + Math.random() * 1000));
    
    //Make sure password is typed twice
    if (req.body.password == req.body.password2 && req.body.password != "")
    {
    //Encrypt password
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
            //Update password
            User.update(query, {password: hash, reset_hash: hash_val}, function(err, writeObj){
            if (err) throw err; 
            if (writeObj.nModified) //sucess
            {
                req.flash('success_msg', 'Password changed!');
                res.redirect('/password_reset');
            }
            else //fail
            {
                req.flash('error_msg', 'Choose a different password.');
                res.redirect('/password_reset');
            }
            });
        });
    });
    }
    else
        {
            
            res.render('change_password', {email: req.body.email, hash: req.body.hash, err: "Passwords must be the same!"});
        }
        
    
});


module.exports = router;
