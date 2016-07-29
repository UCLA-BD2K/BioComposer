var upCarrot = function(id)
{
    this.id = id;
    this.directedUp = true;
    this.html = "<img id='" + this.id + "' src='../images/up_carrot.png' />";
    this.rotate = function()
    {
        if (this.directedUp)
        {
            $('#' + this.id).addClass('rotateArrow');
            this.directedUp = false;
        }
        else
        {
            $('#' + this.id).removeClass('rotateArrow');
            this.directedUp = true;
        }
    }
    
    this.remove = function()
    {
        $('#' + this.id).remove();
    }
}

var fileWindowController = function()
{
    //Variables
    this.files = [];
    this.selectedFile;
    this.isOpen = false;
    this.div = "";
    
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
        $("#fileWindow").remove();
        this.isOpen = false;
    };
    
    //When file is opened
    this.openFile = function(title){
        //prevents from deleting CKEDitor text
        fileOpened = true;
        console.log(title);
        var self = this;
        var data = {title: title};
        $.ajax({
            type: "POST",
            //url: "http://54.186.246.214:3000/open",
            url: "http://localhost:3000/open",
            data: data,
            success: function(data){
                var d = new Date(data.date_modified);
                console.log(data);
                //Set title
                $("#document_title").val(data.title);
                $("#doc_status_text").text("(Last modified " + formatDate(d) + ")");
                $("#document_title").change();
                
                //Set editor data
                callBackLock = true;
                editor.setData(decodeURIComponent(data.contents));
                callBackLock = false;
                
                //Set citations data
                citationSingleton.citationNum = 0;
                var citations = JSON.parse(data.citationObjects);
                var newCitations = {};
                for (var key in citations)
                {
                    //Set parent
                    citations[key].parent = citationSingleton;
                    
                    //Create new citation object
                    console.log(citations[key].id);
                    var newCitation = new citationObj(citations[key].id, citationSingleton, citations[key].citeNum, citations[key].count, citations[key].shortRef, citations[key].longRef, citations[key].paste_lock);
                    
                    //Add to array of citations
                    newCitations[key] = newCitation;
                }
                
                //Set new citations
                citationSingleton.citations = newCitations;
                citationSingleton.citationNum = newCitation.length;
                console.log(citationSingleton);
                self.close();
            },
            dataType: "json"
        });
    };
    
    //AJAX CALL TO LOAD FILES
    this.loadFiles = function(){
        var data = {sendFileNames: true};
        var self = this;
        $.ajax({
            type: "POST",
            //url: "http://54.186.246.214:3000/getFiles",
            url: "http://localhost:3000/getFiles",
            data: data,
            success: function(data){
                console.log(data);
                self.files = data;
                self.displayFiles();
                
            },
            dataType: "json"
    });
    }
    
    this.displayFiles = function()
    {
        for (var i=0; i<this.files.length;i++)
        {
            var dCreated = new Date(this.files[i].date_created);
            var dMod = new Date(this.files[i].date_modified);
            var title = this.files[i].title;
            var docs = "<td>" + title + "</td>" + "<td>" + formatDate(dCreated) + "</td>" + "<td>" + formatDate(dMod) + "</td>";
            var row = $("<tr />", {html: docs});
            row.click({title: title}, function(event){this.openFile(event.data.title)});
            $("#fwTable").append(row);
        }   
    }
    
    this.sortBy = function(obj)
    {
        if (this.sort == "none"){
            this.sort = $(obj).data('type');
            $(obj).html($(obj).html() + this.arrowImg.html);
        }
        //Image exists
        else
        {
            if ($(obj).data('type') != this.sort)
            {
                this.arrowImg.remove();
                $(obj).html($(obj).html() + this.arrowImg.html);
                this.sort = $(obj).data('type');
            }
            else
                this.arrowImg.rotate();
                
        }
        
    }
    
    //Inititialize: Create GUI
    this.init = function()
    {        
        //Create DIV
        this.div = $("<div />").attr("id", "fileWindow");
        var innerWindow = $("<div />").attr("id", "innerFileWindow");
        var toolBar = $("<div />").attr("id", "fwToolbar").append($("<p />").text("WikiFile Navigator")); 
        var closeButton = $("<div />").attr("id", "fwExit");
        
        var tbl = "<table id='fwTable'><tr><th data-type='fn' onclick='fwControllerSingleton.sortBy(this)'>File Name</th><th data-type='dc' onclick='fwControllerSingleton.sortBy(this)'>Date Created</th><th data-type='dm' onclick='fwControllerSingleton.sortBy(this)'>Date Modified</th></tr></table>";
        var fileView = $("<div />", {html: tbl}).attr("id", "fwView");

        
        var self = this;
        closeButton.click(function(){self.close()});
        
        //Link divs
        innerWindow.append(toolBar.append(closeButton));
        innerWindow.append(fileView);
        this.div.append(innerWindow);
        
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
        
        //Loads files
        this.loadFiles();
    }
}

var fwControllerSingleton;
