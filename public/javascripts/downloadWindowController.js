
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
                
        //Add handler to make draggable
        $(toolBar).mousedown(function(e){
            dragHandler(e, "downloadWindow");
        });

        $(document).mouseup(function () {
            // Re-enable text highlight
            $("body").removeClass('disable_text_highlight');  
            $("#downloadWindow").removeClass('disable_text_highlight');
            editor.setReadOnly(false);

            $(document).unbind('mousemove');
        });
        
    }
}

var dlControllerSingleton;
