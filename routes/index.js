//Dependencies
var express = require('express');
var fs = require('fs'); //for filesystem
var exec = require('child_process').exec; //for executing commands
var router = express.Router();
var WikiFile = require('../models/file.js');
var passport = require('passport');
var User = require('../models/user.js');
var localStrategy = require('passport-local').Strategy;
var userController = require("../controllers/userController.js");
var editorController = require("../controllers/editorController.js");
var navigationController = require("../controllers/navigationController.js");

//User authentication function: verifies that user is authenticated
function ensureAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    else {
        res.redirect('/');
    }
}

//Log-In Authorization
//Authenticating user
passport.use(new localStrategy(
    function(username, password, done){
        // Convert username input to Upper Case to allow case-insensitive query
        username = username.toUpperCase();
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

//Simple Page Navigation (Authorization NOT requried)
//Direct to home page
router.get('/', navigationController.home);

//Direct to home page
router.get('/index', navigationController.home);
           
//Render reset password page
router.get('/password_reset', navigationController.passwordReset);


// --- AUTHORIZATION REQUIREED --- //
//Render account settings page
router.get('/account', ensureAuthenticated, navigationController.accountSettings);

//Render the main editor page
router.get('/main', ensureAuthenticated, navigationController.editor);

//USER CONTROLLER PATHS
//Log-in
router.post('/auth', passport.authenticate('local', {failureRedirect: '/', failureFlash: true}), function(req, res){
    res.redirect('/main');
});

//Log-out
router.get('/logout', ensureAuthenticated, userController.logout);

//Register
router.post('/register', userController.register);

//Reset Password
router.post('/reset_pass', userController.resetPassword);

//Change Password
router.get('/change_password', userController.changePassword);

//Submit Changed Password
router.post('/submit_password_change', userController.submitChangePassword);

//EDITOR CONTROLLER PATHS
//Convert File to MediaWiki Format
router.post('/convert', ensureAuthenticated, editorController.checkLock);

//Save file
router.post('/save', ensureAuthenticated, editorController.save);

//Returns a JSON array of all file names
router.post('/getFiles', ensureAuthenticated, editorController.getFiles);

//Deletes specified file
router.post('/delete', ensureAuthenticated, editorController.deleteFile);

//Returns specific file
router.post('/open', ensureAuthenticated, editorController.openFile);

//Downloads and converts wikipedia MediaWiki markup to HTML
router.post('/wikiToHTML', ensureAuthenticated, editorController.wiki2HTML);

//Add reference bookmark
router.post('/add_bookmark', ensureAuthenticated, editorController.addBookmark);

//Delete reference bookmark
router.post('/remove_bookmark', ensureAuthenticated, editorController.removeBookmark);

//Get reference bookmarks
router.post('/get_bookmarks', ensureAuthenticated, editorController.getBookmarks);


module.exports = router;
