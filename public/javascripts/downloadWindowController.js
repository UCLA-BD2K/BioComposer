
var downloadWindowController = function()
{
    //Variables
    this.isOpen = false;
    this.div = "";
    this.sort = "none";
    this.arrowImg = new upCarrot("arrowimg");
    
    //When window is open
    this.open = function(data){
        if (!this.isOpen){
            this.init(data);
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
    this.init = function(data)
    {        
        //Create DIV
        this.div = $("<div />").attr("id", "downloadWindow");
        var innerWindow = $("<div />").attr("id", "innerDownloadWindow");
        var toolBar = $("<div />", {
            class: "windowToolbar",
            id: "dlToolbar",
            html: "<p> Download Wiki Markup"
        });
        var closeButton = $("<div />").attr("id", "fwExit");

        //Initialize Copy-to-Clipboard button
        var clipboard = new Clipboard('#dlWindowCopyBtn');
        clipboard.on('success', function(e) {
            console.log(e);
        });
        clipboard.on('error', function(e) {
            console.log(e);
        });

        var copyButton = $("<button />").attr({"id":"dlWindowCopyBtn", 
            "data-clipboard-action":"copy", "data-clipboard-target":"#contentView"}).text("Copy to clipboard");
        
        var contentViewParent = $("<div />").attr("id", "contentViewParent");
        var contentView = $("<div />").attr("id", "contentView").text(data);

        var self = this;
        closeButton.click(function(){self.close()});
        
        toolBar.append(closeButton);
        toolBar.append(copyButton);
        
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
