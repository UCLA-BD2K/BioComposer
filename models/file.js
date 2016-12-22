var mongoose = require('mongoose');
// var UserSchema = require('../models/user.js');

var WikiFileSchema = mongoose.Schema ({
    title: {
        type: String,
        index: true
    },
    date_created: {
        type: Date
    },
    date_modified: {
        type: Date
    },
    authors: {
        type: Array
    },
    contents: {
        type: String
    },
    citationObjects: {
        type: mongoose.Schema.Types.Mixed
    },
    userId: {
        type: String
    }

});

var WikiFile = module.exports = mongoose.model('WikiFile', WikiFileSchema);