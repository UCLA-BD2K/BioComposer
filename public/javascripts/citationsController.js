//Features to implement still: 
//* Adjust copy and paste so that correct citation generated

//This global variable prevents infinite callbacks between CKEDITOR.on('change') and cleanUp()
var callBackLock = false;

//Citation Handler Singleton Class Definition
var citationClass = function()
{
    this.citationNum = 0;
    this.citations = {}; 
    this.updateCitationCounts = function(){
        //Clean up broke citations
        cleanUp();
        
        for (var key in this.citations)
            this.citations[key].updateCitationCount();
    }
    this.removeCitationByID = function(id){
        this.citationNum--;
        var citeNumOfRemoved = this.citations[id].citeNum;
        this.citations[id].citeNum = 0;
        
        //Remove element from array
        delete this.citations[id];
        
        //Decrement the citation numbers of citations above
        for (var key in this.citations)
            if (this.citations[key].citeNum > citeNumOfRemoved)
                this.citations[key].decrementCiteNum(); //Decrement citeNums and adjust views
        
        //Adjust views
        console.log("Cite Number of Removed: " + citeNumOfRemoved + "\nID: " + id);
        
        //Capture cursor location before changing html
        editor.insertHtml("<a id='placeHolder'></a>");
        
        //set html data to editor
        editor.setData(updateCiteNumViews(editor.getData(), true, citeNumOfRemoved));
        
        //set cursor to original location
        restoreCursorPos("placeHolder", editor);
    }
}; 

//Initialize 
var citationSingleton = new citationClass(); 

//Single Citation Object Class Definition
var citationObj = function(id, parent)
{
    this.count = 0; 
    this.id = id;
    this.parent = parent; //Reference to the citation singleton
    this.citeNum = ++parent.citationNum;
    this.shortRef = "";
    this.longRef = "";
    
    //On CKEDITOR change check if any citations were deleted
    this.updateCitationCount = function(){
        var html = editor.getData();
        dom_div = $('<div />', {html:html});
        var shortRefs = $(dom_div).find('[class="short' + this.id + '"]');
        var longRefs = $(dom_div).find('[class="long' + this.id + '"]');
        this.count = shortRefs.size() + longRefs.size();
        
        console.log("Count: " + this.count + ", ID: " + this.id);
        
        //Convert short ref to long ref if no long refs
        if (longRefs.size() == 0 && shortRefs.size() > 0)
        {
            //Prevent CKEDITOR.on('change')
            callBackLock = true;
            
            //Preserver cursor position
            editor.insertHtml("<a id='placeHolder3'></a>")
            
            //Get html from editor with placeholder
            html = editor.getData();
            
            //create temp div element to DOM manipulate
            dom_div = $('<div />', {html:html});
            
            //DOM Manipulations to convert from short reference to long reference
            var newLongRef = $(dom_div).find('[class="short' + this.id + '"]')[0];
            $(newLongRef).removeClass('short' + this.id);
            $(newLongRef).addClass('long' + this.id);
            $(newLongRef).html(this.longRef);
            
            //Reset data in editor
            editor.setData(dom_div.html());
            
            //restore cursor position
            restoreCursorPos("placeHolder3", editor);
            
            //reset callback lock
            callBackLock = false;
        }
        
        //readjust all citNums
        if (this.count == 0)
            parent.removeCitationByID(this.id);
            
    }
    
    this.decrementCiteNum = function(){
        this.citeNum--;
        
    }
    
    this.generateCitation = function(obj){
        var refHTML;
        
        if (this.count == 0){
            refHTML = this.generateLongRef(obj);
        }
        else
            refHTML = this.generateShortRef();

        editor.insertHtml(refHTML);

        this.count++;
        console.log("Cite number: " + this.citeNum + ", ID: " + this.id);
        console.log(editor.getData());
    }
    
    this.generateShortRef = function()
    {
        var ref = "|ref name=a" + this.id.toString() + " /|";
        this.shortRef = " <a class='short" + this.id + "' href='" + encodeURIComponent(ref) +"'><sup>[" + this.citeNum + "]</sup></a>";
        return this.shortRef;
    }
    
    this.generateLongRef = function(obj)
    {
        var ref;
        //Configure access date
        var accessDate = new Date();
        var day = accessDate.getDate();
        var month = accessDate.getMonth() + 1;
        var year = accessDate.getFullYear();
        var dateAccessString = year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);

        //Re-format published date
        var d = decodeURIComponent($(obj).data("date"));
        var pubDateString;
        if (d.length > 8)
        {
            d = d.substr(5) + " " + d.substr(0, 4);
            var pubDate = new Date(d);    
            day = pubDate.getDate();
            month = pubDate.getMonth() + 1;
            year = pubDate.getFullYear();
            pubDateString = year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
        }
        else
        {
            d = d.substr(5) + " " + d.substr(0, 4);
            pubDateString = d;
        }

        //Generate the citation text
        // |ref| and |eref| are not RESERVED. We didn't use <ref> tags because they get eliminated in pandoc conversion
        ref = "|ref name=a" + this.id.toString() + "|{{cite web |url=" + decodeURIComponent($(obj).data("url")) + " |title=" + decodeURIComponent($(obj).data("title")) + " |author=" + decodeURIComponent($(obj).data("authors")) + " |publisher=" + decodeURIComponent($(obj).data("publisher")) + " |date=" + pubDateString + " |accessdate=" + dateAccessString + "}}|eref|";   

        this.longRef = " <a class='long" + this.id + "' href='" + encodeURIComponent(ref) +"'><sup>[" + this.citeNum + "]</sup></a>";
        return this.longRef;
    }
    
};


function getMonthNum(month)
{
//for some reason switch statement crashed javascript here...
    if (month == "Jan")
        return "01";
    else if (month == "Feb")
        return "02";
    else if (month == "Mar")
        return "03";
    else if (month == "Apr")
        return "04";
    else if (month == "May")
        return "05";
    else if (month == "Jun")
        return "06";
    else if (month == "Jul")
        return "07";
    else if (month == "Aug")
        return "08";
    else if (month == "Sep")
        return "09";
    else if (month == "Oct")
        return "10";
    else if (month == "Nov")
        return "11";
    else if (month == "Dec")
        return "12";
    
}

//Event Handler for Button
function generateCitation(obj)
{
    var id = $(obj).data("id");
    //check if already made citation
    if (citationSingleton.citations[id.toString()])
        citationSingleton.citations[id.toString()].generateCitation(obj);
    else
    { 
        //Citation generated for the first time
        var citation = new citationObj(id, citationSingleton);
        citation.generateCitation(obj);
        citationSingleton.citations[id.toString()] = citation;
    }
    
    citationSingleton.citations[id.toString()].count++;
        
}

//Helper Functions to Process HTML Tags
//This function is so we can process <ref> tags before sending to server for full conversion
function cleanUp()
{
    //Process references
    //create temp div to use DOM manipulation
    var data = editor.getData();
    var isReference = /^\[[0-9]+\]$/;
    var dom_div = $('<div />', {html:data});
    var possible_anchors = dom_div.find("a");
    $.each(possible_anchors, function (i, anchor) {
        var matches = $(anchor).has("sup");
        
        //sometimes <sup> is embedded in <a>
        if (matches.length > 0)   
        {
            //get sup tag
            var sup = $(anchor).find("sup"); 
            var txt = $(sup[0]).html();
            
            //check against reg-ex and see if reference is of form [[0-9]+]
            if (!isReference.test(txt))
                $(anchor).replaceWith("<a id='placeHolder2'></a>");
        }
        else //other times <a> is embedded in <sup>
        {
            var txt = $(anchor).html();
            
            //check against reg-ex and see if reference is of form [[0-9]+]
            if (!isReference.test(txt))
            {
                //eliminate <sup> tags
                //console.log($(anchor).parent());
                if ($(anchor).parent().is("sup"))
                    $(anchor).unwrap();
                
                //Replace anchor with the contents of 'href'
                $(anchor).replaceWith("<a id='placeHolder2'></a>");
            }
        }   
    });

    var processedData = $(dom_div).html();
    
    //Update if changed
    if (processedData != data)
    {
        //Prevent CKEDITOR.on('change') from being called
        callBackLock = true;
        
        //set html data to editor
        editor.setData(processedData);
        
        //Allow it to be called again
        callBackLock = false;
        
        //set cursor to original location
        restoreCursorPos("placeHolder2", editor);
    }
}

function updateCiteNumViews(data, updateCiteNums, deletedNum)
{
    //Process references
    //create temp div to use DOM manipulation
    var dom_div = $('<div />', {html:data});
    var possible_anchors = dom_div.find("a");
    $.each(possible_anchors, function (i, anchor) {
        var matches = $(anchor).has("sup");
        //sometimes <sup> is embedded in <a>
        if (matches.length != 0)   
        {
            //get sup tag
            var sup = $(anchor).find("sup"); 
            var txt = $(sup[0]).html();
            var num = txt.replace(/\[([0-9]+)\]/, "$1");
            
            //Update views if specified
            if (updateCiteNums && deletedNum < num)
            {
                var tmp = parseInt(num);
                txt = "[" + --tmp + "]";
                $(sup[0]).html(txt);
            }
            
        }
        else //other times <a> is embedded in <sup>
        {
            var txt = $(anchor).html();
            var num = txt.replace(/\[([0-9]+)\]/, "$1");
            
            //Update views if specified
            if (updateCiteNums && deletedNum < num)
            {
                var tmp = parseInt(num);
                txt = "[" + --tmp + "]";
                $(anchor).html(txt);
            }
        }
    });
    

    var processedData = $(dom_div).html();
    return processedData;
}

function restoreCursorPos(placeHolderID, editor){
    var element = editor.document.getById(placeHolderID);
    var range;
        if(element) {
            element.scrollIntoView();
            range = editor.createRange();
            range.moveToPosition(element, CKEDITOR.POSITION_AFTER_START);
            editor.getSelection().selectRanges([range]);
            //Remove placeholder
            element.remove(false);
        } 
}

