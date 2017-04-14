//Helper function to allow draggable windows

dragHandler = function(e, id) {
    id = "#" + id;
    // Disable text highlighting when window is dragged
    $("body").addClass('disable_text_highlight');
    $(id).addClass('disable_text_highlight');
    editor.setReadOnly(true);

    //Window dimenions
    var window_x = window.innerWidth;
    var window_y = window.innerHeight;

    //Grab beginning mouse positions
    var mouse_pos_x = e.clientX;   
    var mouse_pos_y = e.clientY;

    console.log("current mouse position: " + mouse_pos_x + ", " + mouse_pos_y);
    
    var initPosX = $(id).position().left;
    var initPosY = $(id).position().top;

    //Window position relative to document
    var initPosX_relative = $(id).offset().left;
    var initPosY_relative = $(id).offset().top;

    $(document).mousemove(function (e) {
        //Grab offset
        var offset_x = e.clientX - mouse_pos_x;
        var offset_y = e.clientY - mouse_pos_y;

        //Use relative x,y pos to check if window will still be on screen
        var bounds_x = initPosX_relative + offset_x;
        var bounds_y = initPosY_relative + offset_y;

        //Check bounds and move window if the window will not be off screen
        if (offset_x < 0 && bounds_x <= 20)
            return;
        if (offset_x > 0 && (bounds_x + $(id).width()) >= (window_x - 20))
            return;
        if (offset_y < 0 && bounds_y <= 20)
            return;
        if (offset_y > 0 && (bounds_y + $(id).height()) >= (window_y - 20))
            return;
        
        //Readjust CSS
        $(id).css({"left" : initPosX + offset_x + "px", "top" : initPosY + offset_y + "px"});

    });
}