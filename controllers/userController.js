//Austin Nasso - August, 2016

//Dependencies
var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var bcrypt = require('bcryptjs');
var sha1 = require('sha1');

//Set up e-mail sender
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport('smtps://genewikidev1%40gmail.com:genewikirox@smtp.gmail.com');

//Interface
function userController(){
    var self = this;
    
    //User Methods
    //Registers a user
    this.register = function(req, res) {return self._register(self, req, res); };
    
    //Logs out a user
    this.logout = function(req, res) {return self._logout(self, req, res); };
    
    //Looks up user in database by e-mail and if exists sends a 'reset password' email and changes the account hash value
    this.resetPassword = function(req, res) {return self._resetPassword(self, req, res); };
    
    //Redirects user to the change password page if the hash value and email in the GET variables match an account
    this.changePassword = function(req, res) {return self._changePassword(self, req, res); };
    
    //Changes the user's password
    this.submitChangePassword = function(req, res) {return self._submitChangePassword(self, req, res); };

    // Adds a citation to the user schema upon clicking favorite
    this.addCitation = function(req, res){
      return self._saveCitation(self, req,res);
    };

    //Queries the existing citations
    this.getCitations = function(req, res) {return self._getCitations(self, req, res); };


}


//Implementation
userController.prototype._register = function(self, req, res){
	var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var password_confirm = req.body.password_confirm;
    var citations = [];
    
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
                        reset_hash: hash_val.toString(),
                            saved_citations: citations,
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
};

userController.prototype._logout = function(self, req, res){
	req.logout();
    res.redirect('/'); 
};

userController.prototype._resetPassword = function(self, req, res){
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
        text : "Click the following link to reset your password: http://localhost:8081/change_password?email=" + encodeURIComponent(req.body.email) + "&hash=" + encodeURIComponent(hash_val.toString())
        };
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
};

userController.prototype._changePassword = function(self, req, res){
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
};

userController.prototype._submitChangePassword = function(self, req, res){
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
};


userController.prototype._saveCitation =
    function (self, req, res) {
         var citations_to_save = req.body.contents;
        User.getUserById(req.user._id, function (err,user) {
            console.log(user);
            var old_citations = user.saved_citations;
            console.log('citations to save are');
            console.log(citations_to_save);
            user.saved_citations.push(citations_to_save); //=  + old_citations;
            user.save(function(err){
                console.log('inside save');
                if (err){
                    console.log("Error in updating user");
                }
            });
            console.log("user's saved citations are");
            console.log(user.saved_citations)
        });

};




userController.prototype._getCitations = function(self, req, res){
    var citation_names = [];
    User.getUserById(req.user.id, function (err,user) {
        for (var x=0; x < user.saved_citations.length; x++)
        {
            var citeInfo = {title: user.saved_citations[x], date_created: null, date_modified: null};
            citation_names.push(citeInfo);
        }

        console.log(citation_names);
        res.send(JSON.stringify(citation_names));

    });

    // console.log("the request for _getCitations is");
    // console.log(req.body);
    // res.send(JSON.stringify(fileNames))
    // // if (req.body.sendFileNames == "true")
    // // {
    // //     User.getUserById(req.user._id, function (err,citations) {
    // //         if (err)
    // //         {
    // //             console.log(err);
    // //             throw err;
    // //         }
    // //
    // //         //fileNames.push(user.saved_citations)
    // //
    // //         // for (var x=0; x<files.length; x++)
    // //         // {
    // //         //     var fileInfo = {title: files[x].title, date_created: files[x].date_created, date_modified: files[x].date_modified}
    // //         //     fileNames.push(fileInfo);
    // //         // }
    // //
    // //         res.send(JSON.stringify(fileNames));
    // //     });
    // // }
};


//Export
module.exports = new userController();

