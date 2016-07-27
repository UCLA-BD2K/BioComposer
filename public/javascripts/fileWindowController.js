var fileWindowController = function()
{
    //Variables
    this.isOpen = false;
    this.div = "";
    
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
        $("#fileWindow").remove();
        this.isOpen = false;
    };
    
    //When file is opened
    this.openFile = function(){};
    
    //Inititialize: Create GUI
    this.init = function()
    {
        //Create DIV
        this.div = $("<div />").attr("id", "fileWindow");
        var innerWindow = $("<div />").attr("id", "innerFileWindow");
        var toolBar = $("<div />").attr("id", "fwToolbar").append($("<p />").text("WikiFile Navigator")); 
        var closeButton = $("<div />").attr("id", "fwExit");
        
        var self = this;
        closeButton.click(function(){self.close()});
        
        //Link divs
        this.div.append(innerWindow.append(toolBar.append(closeButton)));
        
        //Add handlers to make draggable
        $(this.div).mousedown(function (e) {
        e.preventDefault();
            
        //Grab beginning mouse positions
        var mouse_pos_x = e.pageX;   
        var mouse_pos_y = e.pageY;
        
        var initPosX = $("#fileWindow").position().left;
        var initPosY = $("#fileWindow").position().top;

        $(document).mousemove(function (e) {
            //Grab offset
            var offset_x = e.pageX - mouse_pos_x;
            var offset_y = e.pageY - mouse_pos_y;
            
            //Readjust CSS
            $("#fileWindow").css({"left" : initPosX + offset_x + "px", "top" : initPosY + offset_y + "px"});
           

        });
        }).mouseup(function () {
            $(document).unbind('mousemove');
        });

        }
}

var fwControllerSingleton;
