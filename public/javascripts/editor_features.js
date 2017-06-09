//Make the editor a global variable so that is accessible throughout all functions
var editor;
var fileOpened;
var unsavedChanges;

function formatDate(d)
{
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var day = d.getDay();
    var dayNum = d.getDate();
    var mo = d.getMonth();
    var hour = d.getHours();
    var tod = "PM";
    if (hour < 12)
        tod = "AM";
    else if (hour > 12)
        hour -= 12;
    var min = d.getMinutes();
    if (min < 10)
        min = "0" + min;
    var mili = d.getMilliseconds();

    return days[day] + " " + months[mo] + " " + dayNum + ", " + hour + ":" + min + tod;
}

//ESCAPE HTML
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

 function clearEditor() {
    return new Promise(function(resolve, reject) {
        // Clear saved data and init text
        editor.setData("Start typing here..."); 
        citationSingleton.clear();
        beginningCode = "";
        sections=[];

        //Init title and modified status
        $("#document_title").val("Untitled");
        $("#doc_status_text").text("(Unsaved)");

        //Update that current doc is NOT loaded
        fileOpened = false;
        unsavedChanges = false;
        fwControllerSingleton.viewIsLoadedFromSave = false;

        //Delete text on select
        editor.on('focus', function(e) {
            if (!fileOpened)
                editor.setData("");
            
            //remove event listener after first call
            e.removeListener();
        });
        resolve();
    })
 }

//initialize custom
function initEditor()
{   
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.config.allowedContent = true;
    CKEDITOR.config.extraAllowedContent = 'sup[data-*]';
    //Creates CKEditor Instance
    editor = CKEDITOR.inline( 'edit_area' );
    editor.config.extraPlugins = 'button,panelbutton,font';

    fileOpened = false;
    unsavedChanges = false;
    
    //set autogrow for title
    $("#document_title").autogrow({ vertical : false, horizontal : true });
    $("#document_title").focusin(function(){
        $("#document_title").css({"background-color": "rgb(255,244,145)"});
    });
    
    $("#document_title").focusout(function(){
        $("#document_title").css({"background-color": "rgba(255,255,255,0)"});
    });
    
    clearEditor();
    
    editor.on('change', function(e) {
        if (!callBackLock){
            if (Object.keys(citationSingleton.checkCitations).length > 0)
                citationSingleton.updateCitationCounts();

            citationSingleton.checkCitations = {};
        }
        unsavedChanges = true;
    });

    editor.on( 'key', function() {
        var adjacent = findAdjacentCitations();
        if (adjacent != -1)
            citationSingleton.checkCitations[adjacent] = 1;

    } );
    
    editor.on('contentDom', function() {
    this.document.on('mouseup', function(event){
         //your code
         findSelectedCitations();
     });
    });
    
    //Make sure copy and paste works appropriately
    editor.on( 'paste', function( evt ) {
        //get paste html
        callBackLock = true;
        evt.data.dataValue = processPaste(evt.data.dataValue);
        callBackLock = false;
    });
    
    setDimensionsTextArea();
}

//Process pasted citations
function processPaste(html)
{
    var div = $('<div />', {html:html});
    var anchors =  $(div).find("a");

    $.each(anchors, function (i, anchor) {
        var className = anchor.className;
        var pattern = /^(long|short)([0-9]+)$/; 
        //short or long
        var type; 
        var id;
        
        if (pattern.test(className))
        {
            type = className.replace(/^(long|short)([0-9]+)$/, "$1");
            id = className.replace(/^(long|short)([0-9]+)$/, "$2"); 
            if (citationSingleton.citations[id].count > 0)
                $(anchor).replaceWith(citationSingleton.citations[id].generateShortRef());
            if (citationSingleton.citations[id].count == 0)
            {
                citationSingleton.citations[id].citeNum = ++citationSingleton.citationNum;
                $(anchor).replaceWith(citationSingleton.citations[id].longRef.replace(/\[([0-9]+)\]/, "[" + citationSingleton.citations[id].citeNum + "]"));
            }
            citationSingleton.citations[id].count++;                
            citationSingleton.citations[id].paste_lock = true;
        }
    });
    
    if (debugCite)
        citationSingleton.displayCitations();
    
    return $(div).html();
}

//Convert HTML to MediaWiki Functions
function sendHTMLtoServer()
{
    var data = editor.getData()
    console.log("UNPROCESSED: " + data);
    //Process references
    //create temp div to use DOM manipulation
    var dom_div = $('<div />', {html:data});
    var isReference = /^\[[0-9]+\]$/;
    var possible_anchors = dom_div.find("a");
    $.each(possible_anchors, function (i, anchor) {
        var matches = $(anchor).has("sup");
        //sometimes <sup> is embedded in <a>
        if (matches.length != 0)   
        {
            //get sup tag
            var sup = $(anchor).find("sup"); 
            var txt = $(sup[0]).html();
            
            //check against reg-ex and see if reference is of form [[0-9]+]
            if (isReference.test(txt))
            {
                //Replace anchor with the contents of 'href'
                $(anchor).replaceWith(decodeURIComponent($(anchor).attr('href')));
            }
        }
        else //other times <a> is embedded in <sup>
        {
            var txt = $(anchor).html();
            
            //check against reg-ex and see if reference is of form [[0-9]+]
            if (isReference.test(txt))
            {
                //eliminate <sup> tags
                //console.log($(anchor).parent());
                if ($(anchor).parent().is("sup"))
                    $(anchor).unwrap();
                
                //Replace anchor with the contents of 'href'
                $(anchor).replaceWith(decodeURIComponent($(anchor).attr('href')));
            }
        }     
    });

    var processedData = $(dom_div).html();
    console.log("HTML: " + processedData);
    encodedData = encodeURIComponent(processedData); 
    return $.ajax({
        type: "POST",
        //url: "http://54.186.246.214:3000/convert",
        url: "/convert",
        data: {"text": encodedData},
        dataType: "text",
        success: function(data) { console.log("Processed Data: " + data)}
    });
    
}


function downloadWikiMarkUp(data)
{
    console.log(data);
    // convert long references without name attr
    data = data.replace(/\|ref[\s]*\|/g, "<ref>");
    // convert long references
    data = data.replace(/\|ref name\=([^\/]+?(?=\|))\|/g, "<ref name=\'$1\'>");
    // convert short reference
    data = data.replace(/\|ref name\=(.+?(?=\/\|))\/\|/g, "<ref name=\'$1\'/>");
    // convert closing ref tags for long references
    data = data.replace(/\|eref\|/g, "</ref>");
    // Fix bug with quotes in the href
    data = data.replace(/%27/g, "'");
    // Fix bug with colons
    data = data.replace(/\\:/g, ":");
    // Specify class for tables
    data = data.replace(/\{\|/g, "{|  class=\"wikitable\"");
    // specify table headers
    var header_matches = data.match(/\{[\s]*\|[\S\s]*?\|[\s]*\-/g);
    for (var i = 0; i < header_matches.length; i++) {
        // workaround since javascript doesn't support regex lookbehind
        var str = header_matches[i].replace(/\|/g, "!");
        str = str.replace(/\{\!/g, "{|");
        str = str.replace(/\!\-/g, "|-");
        data = data.replace(header_matches[i], str);
    }

    //Add end of wiki markup back
    var footnotes = ""; 
    for (ele in sections){
        footnotes += "== " + sections[ele].name + " ==";
        footnotes += sections[ele].content + "\n";
    }
    
    data += "\n" + footnotes;
    
    //Add info box
    data = beginningCode + data;
    
    //Replace image data
    if (images != null){
    for (var x=0;x<images.length;x++){
        data = data.replace("||IMG" + x + "||", images[x]);
    }}
    
    dwControllerSingleton = new downloadWindowController();
    dwControllerSingleton.open(data);
    /*
    //render data in a new window
    var w = window.open();

    $(w.document.body).css({"white-space": "pre"}).text(data);
    */
}

//Bind to folder button
function openWikiFile(){
    fwControllerSingleton.open();
}

//Bind to wiki button
function openWikiSearch(){
    var open = $("#wikiSearchForm").data("open");
    //If its open, then close it
    if (open){
        $("#wikiSearchForm").css({"z-index": "-5"});
        $("#wikiSearchForm").animate({top: "0px"}, 300, function(){
            $("#wikiSearchForm").data("open", false);
            $("#wikiSearch").val("Search Wikipedia");
        });
    }
    else{
        $("#wikiSearchForm").animate({top: "36px"}, 300, function(){
            $("#wikiSearchForm").css({"z-index": "5"});
            $("#wikiSearchForm").data("open", true);
        });
    }
    
}

//Generate new title (appending number)
function generateTitle(t)
{
    var pattern = /-[0-9]+$/; 
    if (pattern.test(t)){
        var num = parseInt(t.replace(/^.*-([0-9]+)$/, "$1"));
        var title = t.replace(/^(.*)-[0-9]+$/, "$1");
        num++;
    
        return title + "-" + num;
    }
    else
        return t + "-1";
}

//Bind to save button
function documentSave()
{
    var title = $("#document_title").val();
    if (!fwControllerSingleton.viewIsLoadedFromSave)
    {
        if (fwControllerSingleton.fileExists(title)) {
            console.log("File already exists");
            return overwriteDialog(title);
        }
        else {
            return saveAsDialog(title);
        }
    
    } 
    else {
        // Saving opened document, don't need to specify type
        return saveAs(null, title, false);
    }  
}

function askToSaveDialog() {
    var def = $.Deferred();
    var dialog = $('<p>Would you like to save your progress?</p>').dialog({
                dialogClass: 'noTitleStuff dialogShadow',
                buttons: {
                    "No":  function() {
                        dialog.dialog('close');
                        def.reject();
                    },
                    "Yes":  function(){
                        dialog.dialog('close');
                        def.resolve();
                    },
                },
                height: "auto",
                width: 290,
                resizable: false
            });
    return def.then(documentSave);
}

function overwriteDialog(title) {
    var def = $.Deferred();
    var dialog = $('<p>A file already exists by this name. \
                <br>Are you sure you want to overwrite it?</p>').dialog({
                dialogClass: 'noTitleStuff dialogShadow',
                buttons: {
                    "Cancel":  function() {
                        //Keep changing title until it's new
                        var temp = title;
                        while(fwControllerSingleton.fileExists(title))
                        {
                            title = generateTitle(title);
                        }

                        $("#document_title").val(title);
                        $("#document_title").change();
                        dialog.dialog('close');
                        def.reject(title);
                    },
                    "Overwrite":  function(){
                        dialog.dialog('close');
                        def.resolve(title);
                    },
                },
                height: "auto",
                width: 290,
                resizable: false
            });
    return def.then(saveAsDialog);
}

function saveAsDialog(title) {
    var def = $.Deferred();
    var dialog = $('<p>Save as...</p>').dialog({
                dialogClass: 'noTitleStuff dialogShadow',
                buttons: {
                    "Cancel":  function() {
                        dialog.dialog('close');
                        def.reject();
                    },
                    "Template":  function(){
                        dialog.dialog('close');
                        def.resolve("template", title, true);
                    },
                    "Article": function(){
                        dialog.dialog('close');
                        def.resolve("article", title, true);
                    }
                },
                height: "auto",
                width: 290,
                resizable: false,
                draggable: true
            });
    return def.then(saveAs);
}

function saveAs(type, title, overwrite) {
    //In order to stringify, we needed to eliminate duplicate objects. 
    //The parent will only be set to the first element. 
    //Upon opening again, we need to set citationSingleton.citations = [this citations]
    //As well as set citationSingleton.citationNumber = MAX(citations.citeNum)

        var encodedHTML = encodeURIComponent(editor.getData());
        seen = [];
        var citations = JSON.stringify(citationSingleton.citations, function(key, val) {
           if (val != null && typeof val == "object") {
                if (seen.indexOf(val) >= 0) {
                    return;
                }
                seen.push(val);
            }
            return val;
        });
        
        var data = {
            contents : encodedHTML, 
            title : title,
            citations : citations,
            type: type,
            overwrite: overwrite
        };

        return $.ajax({
                type: "POST",
                //url: "http://54.186.246.214:3000/save",
                url: "/save",
                data: data,
                success: function(msg){
                    //alert(msg);
                    alertMessage(msg);
                    $("#doc_status_text").text("(Last saved: " + formatDate(new Date()) + ")");
                    unsavedChanges = false;

                },
                dataType: "text"
            }).then(function() {
                //Make sure file lists are up to date
                fwControllerSingleton.loadFiles();
                fwControllerSingleton.viewIsLoadedFromSave = true;
            });
        
}

function alertMessage(msg) {
    var dialog = $('<p>' + msg + '</p>').dialog({
                dialogClass: 'noTitleStuff dialogShadow',
                position: { my: 'right bottom', at: 'right-10 bottom-10', of: window},
                show: { effect: 'slide', direction: 'right', duration: 700},
                hide: {effect: 'fadeOut', duration: 300},
                open: function () {
                    setTimeout( function () {
                     dialog.dialog("close"); 
                    }, 2000)
                },
                height: 100,
                width: 280
                
            });
}

//--------- END CKEDITOR FUNCTIONS

//For title edit
function titleHandler(obj)
{
    if (obj.value == "")
        obj.value = "Untitled";

    console.log("Title changed");

    // Title name changed. Could be new document
    fwControllerSingleton.viewIsLoadedFromSave = false;
    $("#doc_status_text").text("(Unsaved)");
}

//Configure dimensions of textArea
function setDimensionsTextArea()
{
    var h = $("#editor_window").height() - 40 - 40; //Second 40 to compensate for padding
    var w = $("#editor_window").width() - $("#content_panel").width() - 40; //40 to compensate for padding
    $("#editor").width(w);
    $("#editor").height(h);

    //set position
    $("#editor").css({"left" : $("#content_panel").width() + "px" })
    
    //set position of document title to center
    var offset = Math.ceil(($("#editor_window").width() - $("#content_panel").width())/2 + $("#content_panel").width()) - $("#doc_title_div").width()/2 - 50; 
    $("#doc_title_div").css({"left" : offset.toString() + "px"}); 
}

//----------------------

function adjustResultDimensions()
{
    $("#results_container").width($("#content_panel").width());
    $("#search_results").height($("#content_panel").height() - 240);
}

//Functions for extending side panel
var mouse_pos_x; 
var width;

//MAIN document ready function
$(window).resize(function(){
    setDimensionsTextArea();
    adjustResultDimensions();
})
$(document).ready(function(){
    //Init folder nav window
    fwControllerSingleton = new fileWindowController();
    fwControllerSingleton.loadFiles();

    //Init ckeditor
    initEditor();  
    
    
    //Bind send HTML/download function to download icon
    $("#download").click(function(){sendHTMLtoServer().then(downloadWikiMarkUp)});
    $("#save").click(function(){documentSave()})
    $("#open").click(function(){openWikiFile()});
    $("#wiki").click(function(){openWikiSearch()});
    $("#new_doc").click(function(){openNewDoc()});
    
    
    //On Change title window size
    $("#document_title").on('change', function(){setDimensionsTextArea();});
    
    adjustResultDimensions();
    $("#extend_div").mousedown(function (e) {
        e.preventDefault();
        $(document).css('cursor', 'ew-resize');
        width = $("#content_panel").width();
        mouse_pos_x = e.pageX;   

        $(document).mousemove(function (e) {
            if ($("#content_panel").width()>360 || (e.pageX - mouse_pos_x)>0)
                $("#content_panel").width(width + e.pageX - mouse_pos_x);
            else
                $("#content_panel").width(360);

            setDimensionsTextArea();
            adjustResultDimensions();

        });
    }).mouseup(function () {
        $(document).unbind('mousemove');
    });
});

// Bind to new_doc button
function openNewDoc() {
    if (unsavedChanges)
        return askToSaveDialog().always(clearEditor);
    else
        return clearEditor();
}

// ---- Animations -----
function tabClick(obj){
    $(obj).addClass('tabs-click');
    if (obj.id == 'pubmed')
    {
        $('#google_scholar').removeClass('tabs-click');
        $('#pubmed').addClass('pubmed-click')
    }
    else
    {
        $('#pubmed').removeClass('tabs-click');
        $('#pubmed').removeClass('pubmed-click')
    }
}