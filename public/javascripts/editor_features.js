//Make the editor a global variable so that is accessible throughout all functions
var editor;

//initialize custom
function initEditor()
{   
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.config.allowedContent = true;
    editor = CKEDITOR.inline( 'edit_area' );
    editor.config.extraPlugins = 'button,panelbutton';
    
    
    //set autogrow for title
    $("#document_title").autogrow({ vertical : false, horizontal : true });
    $("#document_title").focusin(function(){
        $("#document_title").css({"background-color": "rgb(255,244,145)"});
    });
    
    $("#document_title").focusout(function(){
        $("#document_title").css({"background-color": "rgba(255,255,255,0)"});
    });
    
    //Init text
    editor.setData("Start typing here..."); 

    //Delete text on select
    editor.on('focus', function(e) {
        editor.setData("");
        
        //remove event listener after first call
        e.removeListener();
    });
    
    editor.on('change', function(e) {
        if (!callBackLock)
            citationSingleton.updateCitationCounts();
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
    //console.log($(div).html());
    
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
    
    //console.log($(div).html());
    return $(div).html();
}

//Convert HTML to MediaWiki Functions
function sendHTMLtoServer()
{
    var data = editor.getData()
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
    //console.log("HTML: " + processedData);
    encodedData = encodeURIComponent(processedData); 
    return $.ajax({
        type: "POST",
        url: "http://54.186.246.214:3000/convert",
        //url: "http://localhost:3000/convert",
        data: {"text": encodedData},
        dataType: "text"
    })
}


function downloadWikiMarkUp(data)
{
    data = data.replace(/\|ref name\=a([0-9]+)\|/g, "<ref name=\'a$1\'>");
    data = data.replace(/\|ref name\=a([0-9]+) \/\|/g, "<ref name=\'a$1\' />");
    data = data.replace(/\|eref\|/g, "</ref>");
    console.log("Converted: " + data);
}

//--------- END CKEDITOR FUNCTIONS

//For title edit
function titleHandler(obj)
{
    if (obj.value == "")
        obj.value = "Untitled";
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
    var offset = Math.ceil(($("#editor_window").width() - $("#content_panel").width())/2 + $("#content_panel").width()) - $("#document_title").width()/2 - 50; 
    $("#document_title").css({"left" : offset.toString() + "px"}); 
    //console.log("offset " + offset);
}

//----------------------

function adjustResultDimensions()
{
    $(".results_container").width($("#content_panel").width());
    $("#pubmed_results").height($("#content_panel").height() - 160);
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
    initEditor();
    
    //Bind send HTML/download function to download icon
    $("#download").click(function(){sendHTMLtoServer().then(downloadWikiMarkUp)});
    
    //On Change title window size
    $("#document_title").on('change', function(){setDimensionsTextArea();});
    
    adjustResultDimensions();
    $("#extend_div").mousedown(function (e) {
        e.preventDefault();
        $(document).css('cursor', 'ew-resize');
        width = $("#content_panel").width();
        //console.log(width);
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