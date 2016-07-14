var editor;
        
//// CKEDITOR FUNCTIONS
//initialize custom
function initEditor()
{   
    CKEDITOR.disableAutoInline = true;
    editor = CKEDITOR.inline( 'edit_area' );
    editor.config.extraPlugins = 'button,panelbutton,colorbutton';
    
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
    editor.on('focus', function() {
        editor.setData(""); 
    });
    
    setDimensionsTextArea();
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
}

//----------------------

function adjustResultDimensions()
{
    $(".results_container").width($("#content_panel").width());
    $("#pubmed_results").height($("#content_panel").height() - 160)
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

    adjustResultDimensions();
    $("#extend_div").mousedown(function (e) {
        e.preventDefault();
        $(document).css('cursor', 'ew-resize');
        width = $("#content_panel").width();
        console.log(width);
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