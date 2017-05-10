//Sort helper functions
function compareTitle(a,b){
    if (a.title.toLowerCase() < b.title.toLowerCase())
        return -1;
    else if (a.title.toLowerCase() > b.title.toLowerCase())
        return 1;
    else
        return 0;
}

function compareDC(a,b){
    if (a.date_created < b.date_created)
        return -1;
    else if (a.date_created > b.date_created)
        return 1;
    else
        return 0;
}

function compareDM(a,b){
    if (a.date_modified < b.date_modified )
        return -1;
    else if (a.date_modified  > b.date_modified)
        return 1;
    else
        return 0;
}

function fileTypeClick(obj) {
    $(".tablinks").removeClass('active');
    $(obj).addClass('active');
    fwControllerSingleton.viewSubsetFiles($(obj).val());
}

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
        this.directedUp = true;
    }
}

var fileWindowController = function()
{
    //Variables
    this.files = []; // Current set of files (e.g. "articles")
    this.allFiles = [];
    this.filter = null;
    this.filteredFiles = [];
    this.selectedFile;
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
        $("#fileWindow").remove();
        this.isOpen = false;
        this.arrowImg.remove();
    };
    
    //Check if file exists
    this.fileExists = function(title){
        for (var i=0;i<this.allFiles.length;i++)
            if (title == this.allFiles[i].title)
                return true;
        return false;
    }
    
    //Search function
    this.searchFw = function(obj){
        var search = obj.value;
        if (obj.value != ""){
        this.filter = new RegExp(search + "*", 'i');
        this.filteredFiles = [];
        for (var i=0;i<this.files.length;i++)
            if (this.filter.test(this.files[i].title))
                this.filteredFiles.push(this.files[i]);
        }
        else
            this.filteredFiles = this.files;
        
        this.displayFiles();
    }

    this.handleTemplateRequest = function(title) {
        this.close();
        var dialog = $('<p>Would you like to...</p>').dialog({
                dialogClass: 'noTitleStuff dialogShadow',
                buttons: {
                    "Edit Template":  function(){
                        fwControllerSingleton.openFile(title, false);
                        dialog.dialog('close');
                    },
                    "Use Template": function(){
                        fwControllerSingleton.openFile(title, true);
                        dialog.dialog('close');
                    },
                    "Cancel":  function() {
                        dialog.dialog('close');
                    }
                },
                height: 185,
                width: 275,
                resizable: false
            });
    }
    
    //When file is opened
    this.openFile = function(title, newDoc){
        //prevents from deleting CKEDitor text
        fileOpened = true;
        console.log(title);
        var self = this;
        var data = {title: title};
        $.ajax({
            type: "POST",
            //url: "http://54.186.246.214:3000/open",
            url: "/open",
            data: data,
            success: function(data){
                var d = new Date(data.date_modified);
                console.log(data);
                
                
                //Set editor data
                callBackLock = true;
                editor.setData(decodeURIComponent(data.contents));
                callBackLock = false;
                
                //Set citations data
                citationSingleton.citationNum = 0;
                var citations = JSON.parse(data.citationObjects);
                if (!(citations === undefined)){
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
                
                citationSingleton.citations = newCitations;
                citationSingleton.citationNum = Object.keys(newCitations).length;
                }

                var docTitle = data.title;
                var lastModified = "(Last modified " + formatDate(d) + ")";
                // Indicates that our current view was loaded from a save
                self.viewIsLoadedFromSave = true;

                // If user opens a template to create new Doc
                if (newDoc) {
                    docTitle = "Untitled";
                    lastModified = "(Unsaved)";
                    self.viewIsLoadedFromSave = false;
                }

                //Set title and modified status
                $("#document_title").val(docTitle);
                $("#doc_status_text").text(lastModified);
                //$("#document_title").change();
                
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
            url: "/getFiles",
            data: data,
            success: function(data){
                console.log(data);
                self.allFiles = data;
                self.viewSubsetFiles('article'); // default viewing is article               
            },
            dataType: "json"
    });
    };

    this.viewSubsetFiles = function(type) {
        this.files = [];
        for (var i = 0; i < this.allFiles.length; i++) {
            if (this.allFiles[i].type == type)
                this.files.push(this.allFiles[i]);
        }
        this.filteredFiles = this.files;
        if (this.isOpen)
            this.displayFiles();
    }
    
    this.displayFiles = function()
    {
        var self = this;
        
        //Replaces all html leaving only the table header
        var rows = $("#fwTable tr"); 
        $.each(rows, function(index, row){
            if (index != 0)
                $(row).remove();
        });
        
        for (var i=0; i<this.filteredFiles.length;i++)
        {
            var dCreated = new Date(this.filteredFiles[i].date_created);
            var dMod = new Date(this.filteredFiles[i].date_modified);
            var title = this.filteredFiles[i].title;
            var type = this.filteredFiles[i].type;
            var docs = "<td>" + title + "</td>" + "<td>" + formatDate(dCreated) + "</td>" + "<td>" + formatDate(dMod) + "</td>";
            var row = $("<tr />", {html: docs});
            row.click({title: title, type:type }, function(event){
                if (event.data.type == 'template')
                    self.handleTemplateRequest(event.data.title);
                else 
                    self.openFile(event.data.title, false)
            });
            row.append($("<div />").addClass("fwDeleteDiv").append($("<img />", {src: "../images/delete.png"}).data("title", title).addClass("fwDelete").click(function(e){
                var this_title = $(this).data("title");
                var deleteRecord = confirm("Are you sure you want to delete '" + this_title + "'?");
                if (deleteRecord){
                    var data = {title: this_title};
                    $.ajax({
                        type: "POST",
                        //url: "http://54.186.246.214:3000/delete",
                        url: "/delete",
                        data: data,
                        success: function(data){
                            
                            //Delete from file array
                            for (var i=0;i<self.files.length;i++)
                            {
                                if (self.files[i].title == this_title)
                                    self.files.splice(i, 1);
                            }
                            
                            //Delete from filtered array
                            for (var k=0;k<self.filteredFiles.length;k++)
                            {
                                if (self.filteredFiles[k].title == this_title)
                                    self.filteredFiles.splice(k, 1);
                            }

                            self.displayFiles();
                        },
                        dataType: "json"
                    });
                }
                e.stopPropagation();
            }).hide()));
            row.mouseover(function(){$(this).find(".fwDelete").show()});
            row.mouseout(function(){$(this).find(".fwDelete").hide()});
            $("#fwTable").append(row);
        }   
    }
    
    this.sortBy = function(obj)
    {
        //Set up view
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
        
        switch ($(obj).data('type')){
            case "fn":
                this.files.sort(compareTitle);
                this.filteredFiles.sort(compareTitle);
                break;
            case "dm":
                this.files.sort(compareDM);
                this.filteredFiles.sort(compareDM);
                break;
            case "dc":
                this.files.sort(compareDC);
                this.filteredFiles.sort(compareDC);
                break;
            default: 
                alert("4");
                break;
        }
        
        if (!this.arrowImg.directedUp)
                this.filteredFiles.reverse();
        
        this.displayFiles();
    }
    
    //Inititialize: Create GUI
    this.init = function()
    {        
        //Create DIV
        this.div = $("<div />").attr("id", "fileWindow");
        var innerWindow = $("<div />").attr("id", "innerFileWindow");
        var toolBar = $("<div />").attr("class", "windowToolbar").append($("<p />").text("WikiFile Navigator")); 
        var closeButton = $("<div />").attr("id", "fwExit");
        
        var fileType = $("<div/>", {
            html: '<div class="tab">' +
                '<button class="tablinks active" value="article" onclick="fileTypeClick(this)">Articles</button>' +
                '<button class="tablinks" value="template" onclick="fileTypeClick(this)">Templates</button>' + 
                '</div>'
            });

        var tbl = "<table id='fwTable'><tr><th data-type='fn' onclick='fwControllerSingleton.sortBy(this)'>File Name</th><th data-type='dc' onclick='fwControllerSingleton.sortBy(this)'>Date Created</th><th data-type='dm' onclick='fwControllerSingleton.sortBy(this)'>Date Modified</th></tr></table>";
        var fileViewParent = $("<div />").attr("id", "fwViewParent");
        var fileView = $("<div />", {html: tbl}).attr("id", "fwView");
        
        fileViewParent.append(fileView);
        
        var searchHTML = "<div id='file_search_wrap'><input type='text' value='Search Files' id='fwSearchBar' class='input_blur' onfocus='selectInput(this, \"Search Files\")' onblur='deselectInput(this, \"Search Files\")' onkeyup='fwControllerSingleton.searchFw(this)'></input></div>";
        var searchBar = $("<div />", {html: searchHTML}).attr("id", "fwSearch");

        
        var self = this;
        closeButton.click(function(){self.close()});
       

        toolBar.append(closeButton);
        toolBar.append(searchBar);
        toolBar.append(fileType);

        //Link divs
        innerWindow.append(toolBar);
        innerWindow.append(fileViewParent);

        this.div.append(innerWindow);
        
        //Add handler to make draggable
        $(toolBar).mousedown(function(e){
            dragHandler(e, "fileWindow");
        });

        $(document).mouseup(function () {
            // Re-enable text highlight
            $("body").removeClass('disable_text_highlight');  
            $("#fileWindow").removeClass('disable_text_highlight');
            editor.setReadOnly(false);

            $(document).unbind('mousemove');
        });
        
        //Loads files
        this.loadFiles();
    }
}

var fwControllerSingleton;
