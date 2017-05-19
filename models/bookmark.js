var mongoose = require('mongoose');

var BookmarkSchema = mongoose.Schema ({
    bookmark_id : {
        type: String
    },
    date_saved: {
        type: Date
    },
    user: {
        type: String
    },
    html_content: {
        type: String
    },
    api: {         // (e.g. pubmed)
        type: String
    },
    ref_data: {
        type: Object
    }
})

var Bookmark = module.exports = mongoose.model('Bookmark', BookmarkSchema);