//Features to implement still: 
//* Adjust copy and paste so that correct citation generated

//This global variable prevents infinite callbacks between CKEDITOR.on('change') and cleanUp()
var callBackLock = false;
var debugCite = 1;

//Debug vars
var i = 0;
var j = 0;
var k = 0;
//Citation Handler Singleton Class Definition
var citationClass = function()
{
    this.citationNum = 0;
    this.citations = {}; 
    this.checkCitations = {};
    this.updateCitationCounts = function(){
        console.log("updateCitationCounts " + i);
        i++;
        j=0;
        
        //Clean up broken citations
        cleanUp();
        
        //Only update citations that need to be checked
        for (var key in this.checkCitations){
            console.log("sonnny d " + key + " " + this.checkCitations[key]);
            if (this.checkCitations.hasOwnProperty(key) && this.checkCitations[key]){
                this.citations[key].updateCitationCount();
                console.log("KEY UPDATED: " + key);
            }
        }
        //Clear check citations
        this.checkCitations = {};
    }
    
    this.displayCitations = function(){
        console.log("");
        console.log("//------ CITATIONS -------//");
        console.log("citationSingleton: " + this.citationNum);
        for (var key in this.citations)
            console.log("Citation ID: " + key + ", CITENUM: " + this.citations[key].citeNum + ", COUNT: " + this.citations[key].count);
        console.log("//------ END -------//");
        //console.log(editor.getData());
    }
    
    this.removeCitationByID = function(id){
        console.log("removeCitationByID " + i);
        this.citationNum--;
        var citeNumOfRemoved = this.citations[id].citeNum;
        this.citations[id].citeNum = 0;
        
        //Remove element from array
        delete this.citations[id];
        
        //Decrement the citation numbers of citations above
        for (var key in this.citations) {
            if (this.citations[key].citeNum > citeNumOfRemoved)
            {
                this.citations[key].decrementCiteNum(); //Decrement citeNums and adjust views
                if (debugCite)
                    console.log("Citation: " + key + " decremented");
            }
        }
        
        //Adjust views
        if (debugCite)
            console.log("Cite Number of Removed: " + citeNumOfRemoved + "\nID: " + id);
        
        callBackLock = true;
        
        //Capture cursor location before changing html
        editor.insertHtml("<a id='placeHolder'></a>");
        
        //set html data to editor
        editor.setData(updateCiteNumViews(editor.getData(), true, citeNumOfRemoved));
        
        callBackLock = false;
        
        //set cursor to original location
        restoreCursorPos("placeHolder", editor);
    }
    
    this.clear = function(){
        this.citationNum = 0;
        this.citations = {};
    }
}; 

//Initialize 
var citationSingleton = new citationClass(); 

//Single Citation Object Class Definition
var citationObj = function(id, parent, citeNum, count, shortRef, longRef, paste_lock)
{
    this.id = id;
    //Type: 'Wiki' or 'PubMed'
    this.type = "";
    this.parent = parent; //Reference to the citation singleton
    
    if (citeNum === undefined)
        this.citeNum = ++parent.citationNum;
    else
        this.citeNum = citeNum;
    
    //Set Count
    if (count === undefined)
        this.count = 0;
    else
        this.count = count; 
    
    //Set short ref
    if (shortRef === undefined)
        this.shortRef = "";
    else
        this.shortRef = shortRef;
    
    //Set longref
    if (longRef === undefined)
        this.longRef = "";
    else
        this.longRef = longRef;

    //Set paste_lock
    if (paste_lock === undefined)
        this.paste_lock = false;
    else
        this.paste_lock = paste_lock;
    
    //reinit when count is 0
    this.reinit = function(obj){
        this.citeNum = ++this.parent.citationNum;
        this.generateCitation(obj);
        
        if (debugCite)
            console.log("REINIT");
    }
    
    //On CKEDITOR change check if any citations were deleted
    this.updateCitationCount = function(){
        console.log("updateCitationCount (" + this.id + ") " + j);
        j++;
        
        //Prevents from updating before paste action is registered
        if (this.paste_lock)
        {
            this.paste_lock = false;
            return;
        }
        
        var html = editor.getData();
        dom_div = $('<div />', {html:html});
        var shortRefs = $(dom_div).find('[class="short' + this.id + '"]');
        var longRefs = $(dom_div).find('[class="long' + this.id + '"]');
        var newCount = shortRefs.size() + longRefs.size();
        if (this.count > (newCount))
        {
            if (debugCite)
                console.log("ID: " + this.id + ", COUNT: " + this.count + ", NEWCOUNT: " + newCount + ", SHORT: " + shortRefs.size() + ", LONG: " + longRefs.size());
            this.count = newCount;
            
            if (debugCite)
                citationSingleton.displayCitations();
        }
        
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
            var data = this.longRef.replace(/\[([0-9]+)\]/, "[" + this.citeNum + "]");
            var reg = /\|sup data-id='([0-9]+)'\|\[([0-9]+)\]\|\/sup\|/g;
            data = data.replace(reg, "<sup data-id='$1'>[$2]</sup>");
            $(newLongRef).html(data);
            
            
            //Reset data in editor
            editor.setData(dom_div.html());
            
            //restore cursor position
            restoreCursorPos("placeHolder3", editor);
            
            //reset callback lock
            callBackLock = false;
        }
        
        //readjust all citNums
        if (this.count == 0 && this.citeNum != 0)
            parent.removeCitationByID(this.id);
            
    }
    
    this.decrementCiteNum = function(){
        this.citeNum--;
        
    }
    
    this.generateCitation = function(obj){
        var refHTML;
        if ($(obj).data("type"))
            this.type = $(obj).data("type");
        if (this.count == 0){
            refHTML = this.generateLongRef(obj);
        }
        else
            refHTML = this.generateShortRef();

        console.log(refHTML);
        editor.insertHtml(refHTML);

        this.count++;
    }
    
    //Create citation object for citations downloaded form Wikipedia Markup online
    this.generateCitationFromWikiCitation = function(ref){
        this.type = "Downloaded";
        this.longRef = ref.long;
        this.shortRef =  ref.short;
        this.count = ref.count;
    }
    
    this.generateShortRef = function()
    {
        var ref = "|ref name=a" + this.id.toString() + "||eref|";
        this.shortRef = " <a class='short" + this.id + "' href='" 
            + encodeURIComponent(ref) +"' data-id='" + this.id + "'><sup data-id='" 
            + this.id + "'>[" + this.citeNum + "]</sup></a>";
        return this.shortRef;
    }
    
    //helper function to avoid WikiMark Down syntax errors
    function removeBrackets(text){
        text = text.replace(/\]/g, "");
        text = text.replace(/\[/g, "");
        
        //Custom replace single quotes
        text = text.replace(/'/g, "%27");
        return text;
    }
    
    this.generateLongRef = function(obj)
    {
        var ref;
        //Configure access date
        var accessDate = new Date();
        var day = accessDate.getDate();
        var month = accessDate.getMonth() + 1;
        var year = accessDate.getFullYear();
        var dateAccessString = year + "-" + (month < 10 ? "0" + month : month) 
            + "-" + (day < 10 ? "0" + day : day);

        //Generate the citation text
        // |ref| and |eref| are not RESERVED. We didn't use <ref> tags because they get eliminated in pandoc conversion
        ref = "|ref name=a" + this.id.toString() + "|{{cite web";

        if ($(obj).data("url")) 
            ref += "|url=" + decodeURIComponent($(obj).data("url"));
        if ($(obj).data("title"))
            ref +=" |title=" + removeBrackets(decodeURIComponent($(obj).data("title"))) 
        if ($(obj).data("authors"))
            ref += " |author=" + decodeURIComponent($(obj).data("authors")) 
        if ($(obj).data("publisher"))
            ref += " |publisher=" + decodeURIComponent($(obj).data("publisher"))
        if ($(obj).data("website"))
            ref += " |website=" + decodeURIComponent($(obj).data("website"))
        if ($(obj).data("date")) {
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
                pubDateString = year + "-" + (month < 10 ? "0" + month : month) 
                    + "-" + (day < 10 ? "0" + day : day);
            }
            else
            {
                d = d.substr(5) + " " + d.substr(0, 4);
                pubDateString = d;
            }
            ref += " |date=" + pubDateString 
        }
 
        ref += " |accessdate=" + dateAccessString + "}}|eref|";

        this.longRef = " <a class='long" + this.id + "' href='" 
            + encodeURIComponent(ref) +"' data-id='" + this.id + "'><sup data-id='" 
            + this.id + "'>[" + this.citeNum + "]</sup></a>";
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
    if (citationSingleton.citations[id])
    {
        //Upon reinititialization
        if (citationSingleton.citations[id].citeNum == 0)
            citationSingleton.citations[id].reinit(obj);
        else
            citationSingleton.citations[id].generateCitation(obj);
    }
    else
    { 
        //Citation generated for the first time
        var citation = new citationObj(id, citationSingleton);
        citation.generateCitation(obj);
        citationSingleton.citations[id.toString()] = citation;
    }   
    
    //Get out of superscript mode
    editor.execCommand('superscript');
    
    if (debugCite)
    {
        citationSingleton.displayCitations();
        console.log(citationSingleton);
    }
    
}

//Helper Functions to Process HTML Tags
//This function is so we can process <ref> tags before sending to server for full conversion
function cleanUp()
{
    console.log("Clean Up " + k);
    k++;
    
    //Process references
    //create temp div to use DOM manipulation
    var data = editor.getData();
    var isBrokenReference1 = /^\[[0-9]+$/; // user deleted ]
    var isBrokenReference2 = /^[0-9]+\]$/; // user deleted [
    var isBrokenReference3 = /^\[\]$/; // user deleted cite #
    var dom_div = $('<div />', {html:data});
    var originalData = $(dom_div).html();
    var possible_anchors = dom_div.find("a");
    $.each(possible_anchors, function (i, anchor) {
        var matches = $(anchor).has("sup");
        
        //sometimes <sup> is embedded in <a>
        if (matches.length > 0)   
        {
            //get sup tag
            var sup = $(anchor).find("sup"); 
            var txt = $(sup[0]).html();
            
            //check against reg-ex and see if reference is not of form [[0-9]+]
            if (isBrokenReference1.test(txt) 
                || isBrokenReference2.test(txt)
                || isBrokenReference3.test(txt)) {
                $(anchor).replaceWith("<a id='placeHolder2'></a>");
            }
        }
        else //other times <a> is embedded in <sup>
        {
            var txt = $(anchor).html();
            
            //check against reg-ex and see if reference is not of form [[0-9]+]
            if (isBrokenReference1.test(txt) 
                || isBrokenReference2.test(txt)
                || isBrokenReference3.test(txt)) {
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
    if (processedData != originalData)
    {
        //Prevent CKEDITOR.on('change') from being called
        callBackLock = true;
        
        //set html data to editor
        editor.setData(processedData);
        
        //set cursor to original location
        restoreCursorPos("placeHolder2", editor);
        
        //Allow it to be called again
        callBackLock = false;
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

//FUNCTIONS TO DETERMINE WHICH CITATIONS ARE NEAR THE CURSOR.
//In order to minimize function calls, we will only update citation counts of citations that COULD be changed

//Returns adjacent citation or -1 if none nearby
function findAdjacentCitations(){
    var id = editor.getSelection().getStartElement().data("id");
    if (id==null)
        return -1;
    else
        return id;
}

//Returns array of selected citations or -1 if none selected
function findSelectedCitations(){
    var range = editor.getSelection().getRanges()[ 0 ];
//    console.log("Start offset: " + range.startOffset);
//    console.log("End offset: " + range.endOffset);
    if (range == null)
        return;
    //Determine if text selected before proceeding
    if (range.startOffset != range.endOffset){        
        //Create temp ckeditor div element
        var el = new CKEDITOR.dom.element("div");
        el.append(range.cloneContents());

        //Convert to regular div
        var div = $('<div />', {html:el.getHtml()});
        
        //Find the sup tags
        var possible = $(div).find("sup");
        
        //Reset citations to check
        citationSingleton.checkCitations = {};
        
        if (debugCite)
            console.log(div.html());
        $.each(possible, function (i, anchor) {
            //Add ids to checkCitations
            if ($(anchor).data("id") != null){
                citationSingleton.checkCitations[$(anchor).data("id")] = 1;
                console.log($(anchor).data("id"));
            }
        });
    }
}

