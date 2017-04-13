
var downloadWindowController = function()
{
    //Variables
    this.isOpen = false;
    this.div = "";
    this.viewIsLoadedFromSave = false;
    this.sort = "none";
    this.arrowImg = new upCarrot("arrowimg");
    
    //When window is open
    this.open = function(){
        if (!this.isOpen){
            this.init();
            $("body").prepend(this.div);
            this.isOpen = true;
        }
    };
    
    //When window is closed
    this.close = function(){
        $("#downloadWindow").remove();
        this.isOpen = false;
        this.arrowImg.remove();
    };
    
    //Inititialize: Create GUI
    this.init = function()
    {        
        //Create DIV
        this.div = $("<div />").attr("id", "downloadWindow");
        var innerWindow = $("<div />").attr("id", "innerDownloadWindow");
        var toolBar = $("<div />").attr("id", "fwToolbar").append($("<p />").text("Download Wiki Markup")); 
        var closeButton = $("<div />").attr("id", "fwExit");

        var contentViewParent = $("<div />").attr("id", "contentViewParent");
        var contentView = $("<div />").attr("id", "contentView");
        
        var self = this;
        closeButton.click(function(){self.close()});
        
        toolBar.append(closeButton);
        
        //Link divs
        innerWindow.append(toolBar);
        contentViewParent.append(contentView);
        innerWindow.append(contentViewParent);
        this.div.append(innerWindow);
        
        
        //Add handlers to make draggable
        $(toolBar).mousedown(function (e) {

            // Disable text highlighting when window is dragged
            $("body").addClass('disable_text_highlight');
            $("#fileWindow").addClass('disable_text_highlight');
            editor.setReadOnly(true);
                
            //Grab beginning mouse positions
            var mouse_pos_x = e.pageX;   
            var mouse_pos_y = e.pageY;
            
            var initPosX = $("#downloadWindow").position().left;
            var initPosY = $("#downloadWindow").position().top;

            $(document).mousemove(function (e) {
                //Grab offset
                var offset_x = e.pageX - mouse_pos_x;
                var offset_y = e.pageY - mouse_pos_y;
                
                //Readjust CSS
                $("#downloadWindow").css({"left" : initPosX + offset_x + "px", "top" : initPosY + offset_y + "px"});
               

            });
        }).mouseup(function () {
            // Re-enable text highlight
            $("body").removeClass('disable_text_highlight');  
            $("#fileWindow").removeClass('disable_text_highlight');
            editor.setReadOnly(false);
            
            $(document).unbind('mousemove');
        });
        
    }
}

var dlControllerSingleton;
