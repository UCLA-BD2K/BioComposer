   ___    _        _____                    __            
  / _ )  (_) ___  / ___/ __ __  ____ ___ _ / /_ ___   ____
 / _  | / / / _ \/ /__  / // / / __// _ `// __// _ \ / __/
/____/ /_/  \___/\___/  \_,_/ /_/   \_,_/ \__/ \___//_/   
                                                          
Version 1.0
Developed by Austin Nasso
Published by HeartBD2K @ UCLA, 2016


INTRODUCTION
------------
BioCurator is a fully fledged Wikipedia article curating platform designed to  make writing detailed medical articles easier than ever. This platform is developed with a NodeJS/Mongo/Express back-end and a JS/HTML/CSS/JQuery rendered by EJS. 

Key Features: 
* WYSIWYG Visual article editor
* Automatic reference generator
* Seamless integration with Google Scholar and PubMed

REQUIREMENTS
------------
* Linux/Unix OS to run the NodeJS server.
* Node v4.4.5
* npm v2.15.5
* nvm v4.4.5
* ExpressJS

INSTALLATION
------------
* Download the GIT repository
* Type 'npm install' to install other dependencies
* Go into the repo and type 'npm start' from your command line to run the server
* Go to your browser and type 'http://localhost:3000' to access the site
* Install Pandoc: for mac - brew install pandoc
* Install mongodb

CONFIGURATION
-------------
When changing .js server side files it is necessary to restart the server (kill -9 [pid of server]), but not when changing .EJS, .CSS or .js client side files. For some systems, the operating system continues to bind to port 3000 (the port used by default for the local server) after quitting the server with CTRL-Z which is why it may be necessary to kill -9 the process in order to restart the server. 
