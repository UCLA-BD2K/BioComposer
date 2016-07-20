//Citation Handler Singleton Class Definition
var citationClass = function()
{
    this.citationNum = 0;
    this.citations = {}; 
    this.updateCitationCounts = function(){
        for (var key in this.citations)
            this.citations[key].updateCitationCount();
    }
    this.removeCitationByID = function(id){
        this.citationNum--;
        var citeNumOfRemoved = this.citations[id].citeNum;
        
        //Remove element from array
        delete this.citations[id];
        //alert("Citation " + id + " removed!");
        
        //Decrement the citation numbers of citations above
        for (var key in this.citations)
            if (this.citations[key].citeNum > citeNumOfRemoved)
                this.citations[key].decrementCiteNum(); //Decrement citeNums and adjust views
        
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
    
    this.updateCitationCount = function(){
        var htmlContents = processRefTags(editor.getData());
        console.log(htmlContents);
        var dom_div = $('<div />', {html:htmlContents});
        var count = $(dom_div).find('[name="a' + this.id + '"]').size();
        this.count = count;
        console.log("Count: " + count);
        
        //readjust all citNums
        if (this.count == 0)
        {
            this.citeNum = 0;
            parent.removeCitationByID(this.id);
        }
            
    }
    
    this.decrementCiteNum = function(){
        this.citeNum--;
        
        //Code to update views
        
    }
    
    this.generateCitation = function(obj){
        var ref;
        if (this.count == 0){
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
        }
        else
            ref = "|ref name=a" + this.id.toString() + " /|";
        
        var refHTML = "<a href='" + encodeURIComponent(ref) +"'><sup>[" + this.citeNum + "]</sup></a>";
        editor.insertHtml(refHTML);

        this.count++;
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
    { //Citation generated for the first time
        var citation = new citationObj(id, citationSingleton);
        citation.generateCitation(obj);
        citationSingleton.citations[id.toString()] = citation;
    }
    
    citationSingleton.citations[id.toString()].count++;
        
}

