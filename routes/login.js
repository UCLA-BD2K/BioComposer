var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var bcrypt = require('bcryptjs');
var sha1 = require('sha1');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

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

module.exports = router;
