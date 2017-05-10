//Austin Nasso - August, 2016

//Interface
function navigationController(){
    var self = this;
    
    //User Methods
    //Renders the home page
    this.home = function(req, res) {return self._home(self, req, res); };
    
    //Renders the account settings page
    this.accountSettings = function(req, res) {return self._accountSettings(self, req, res); };
    
    //Renders the main editor page
    this.editor = function(req, res) {return self._editor(self, req, res); };
    
    //Renders the password reset page
    this.passwordReset = function(req, res) {return self._passwordReset(self, req, res); };
}

//Implementation
navigationController.prototype._home = function(self, req, res){
    // If user authenticated, redirect to editor
    if (req.isAuthenticated()){
        res.render('editor');
    }
    // Home page, no auth required
    else {
        res.render('index', { title: 'BioComposer', reg_status: "none" });
    }
}

navigationController.prototype._accountSettings = function(self, req, res){
    res.render('account_settings');
}

navigationController.prototype._editor = function(self, req, res){
    res.render('editor');
}

navigationController.prototype._passwordReset = function(self, req, res){
    res.render('password_reset');
}

//Export
module.exports = new navigationController();
    