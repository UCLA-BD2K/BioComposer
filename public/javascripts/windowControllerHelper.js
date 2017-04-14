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

    console.log("Current mouse position: " + mouse_pos_x + ", " + mouse_pos_y);
    
    var initPosX = $(id).position().left;
    var initPosY = $(id).position().top;

    //Window position relative to document
    var initPosX_relative = $(id).offset().left;
    var initPosY_relative = $(id).offset().top;

    $(document).mousemove(function (e) {
        //Grab offset
        var offset_x = e.clientX - mouse_pos_x;
        var offset_y = e.clientY - mouse_pos_y;

        // Define border lines by amount of padding
        var borderPadding = 50;
        // Prevent window from being dragged if mouse passes border lines set
        if (e.clientX >= borderPadding &&
            e.clientX <= (window_x - borderPadding) &&
            e.clientY >= borderPadding &&
            e.clientY <= (window_y - borderPadding)) {
            //Readjust CSS
            $(id).css({"left" : initPosX + offset_x + "px", "top" : initPosY + offset_y + "px"});
        }
    });
}