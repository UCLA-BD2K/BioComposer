var footerSections = ["References", "Further reading", "See also", "External links", "Recommended reading"];
//Object we create to store the footer data
var footer;

var x = 0;
//These helper functions help partition MarkDown
function getSectionsByName(article, names){
    var articleArray = [];
    var start = 0;
    var end = 0;
    var content = "";
    var endOfText = false;
    var firstFooterHeaderPosition = -1;
    console.log(names);
    while (!endOfText){
        start = article.indexOf("==", end);
        end = article.indexOf("==", start + 2) + 2;
        if (end == -1 || start == -1){
            console.log("over");
            break;
        }
        console.log("start: " + start + ", end: " + end);
        console.log(article.substring(start, end).toLowerCase());
        
        for (index in names){
            console.log(names[index]);
            if (article.substring(start, end).toLowerCase().includes(names[index].toLowerCase()))
                {
                    console.log("MATCH");
                    //Capture the start so we can find where the main content ends
                    if (firstFooterHeaderPosition == -1)
                        firstFooterHeaderPosition = start;
                    
                    start = end;
                    if (article.indexOf("==", start) == -1){
                        endOfText = true;
                        end = article.length;
                    }
                    else
                        end = (article.indexOf("==", start) < article.length ? article.indexOf("==", start) : article.length);
                           
                    //Set the content under the header
                    content = article.substring(start, end);
                    
                    //Push element to array
                    articleArray.push({name: names[index], content: content});
                    break;
                }
        }
    }
    
    //Add main content partition
    articleArray.push({name: 'main', content: article.substr(0, firstFooterHeaderPosition)});
    console.log(articleArray);
    return articleArray;
}








function extractReferences(text){
    //Variables to keep track of references
    var startTag = "<ref";
    var endTag = "</ref>";
    var shortEndTag = "/>";
    var isShort = false;
    var len = text.length;
    var cursorStart = 0;
    var cursorEnd = 0;

    //Array to store all ref tags
    var reflist = [];

    while(true){
        //Get beginning of ref tag
        cursorStart = text.indexOf(startTag, cursorEnd);

        //Account for both short hand and long hand references
        if ((text.indexOf(endTag, cursorStart) < text.indexOf(shortEndTag, cursorStart) && text.indexOf(endTag, cursorStart) != -1) || text.indexOf(shortEndTag, cursorStart) == -1){
            cursorEnd = text.indexOf(endTag, cursorStart);
            isShort = false;
        }
        else{
            cursorEnd = text.indexOf(shortEndTag, cursorStart);
            isShort = true;
        }

        //Additional to compensate for length of end tag
        cursorEnd += (isShort ? shortEndTag.length : endTag.length);

        //If == -1, no match
         if (cursorStart == -1 || cursorEnd == -1 || cursorStart > cursorEnd){
            console.log("End");
            break;
        }

        //Create reference object
        var ref = {contents: text.substring(cursorStart, cursorEnd), isShort: isShort};
        reflist.push(ref);
    }

    return reflist;   
}

//Extracts the body of the citation beginning with "{{" and ending with "}}"
function extractCitationBody(citeString){
    var start = citeString.indexOf("{{");
    var end = citeString.indexOf("}}");
    return citeString.substring(start, end+2);
}

function convertAndReplaceReferences(reflist, text){
    var newrefs = {};
    var noName = 0;
    var uniqueRefNum = 1;
    for (var x=0; x<reflist.length;x++){

        //Variables for lookup
        var posStart = 0;
        var posEnd = 0;
        var reftext = "";
        var shortreftext = "";

        //If long reference, try to grab the ID
        if (!reflist[x].isShort){
            var newRef = {};
            var id;
            var matches;
            var name;

            posStart = reflist[x].contents.indexOf("pmid = ");
            if (posStart != -1){
                //Get to the actual numbers
                posStart += 7; 
                posEnd = reflist[x].contents.indexOf(" ", posStart);
                id = reflist[x].contents.substring(posStart, posEnd);
            }
            else
                id = noName++;

            //EXTRACT NAME 
            matches = reflist[x].contents.match(/\<ref(\s+)name(\s*)=(\s*)?\"?(.+?)\"?(\s*)?\>/);
            if (matches == null)
                name = "a" + id;
            else
                name = matches[4];

            //Add name to citation
            reflist[x].name = name;

            //DEBUGGING PRINT STATEMENTS
            console.log("LONG NAME: " + name);
            console.log(reflist[x], x, reflist.length);
            
            //Extract {{citation}}
            var reference = extractCitationBody(reflist[x].contents);

            //Now we change the name to 'a' + ID to match BioCurator
            reftext = "|ref name=a" + id + "|" + reference + "|eref|";
            
            //NEEDS TO BE FIXED SO THAT THERE IS ONLY ONE NAME
            console.log(reftext);
            shortreftext =  "|ref name=a" + id + " /|";  

            //Create primitive reference object
            newRef["id"] = id;
            newRef["fullRef"] = reflist[x].contents;
            newRef["long"] = "<a class='long" + id + "' href=\"" + encodeURIComponent(reftext) + "\"><sup>[" + uniqueRefNum + "]</sup></a>";
            newRef["short"] = "<a class='short" + id + "' href=\"" + encodeURIComponent(shortreftext) + "\"><sup>[" + uniqueRefNum + "]</sup></a>";
            newRef["complete"] = true;
            newRef["count"] = 1;

            //Index by name (citations with name attributes are index by name, otherwise name is set to ID)
            newrefs[name] = newRef;

            //Increment unique reference count
            uniqueRefNum++;

        }
        //If short reference, lookup ID
        else{
            matches = reflist[x].contents.match(/\<ref(\s+)name(\s*)=(\s*)?\"?(.+?)\"?(\s*)?\/\>/);
            if (matches == null ){
                console.log("Error: Short reference has no name attribute.");
                return -1;
            }
            else{
                //Set name
                name = matches[4];
                console.log("SHORT NAME: " + name);
                console.log(reflist[x], x, reflist.length);
                reflist[x].name = name;
            }
        }   
    }

    //Replace citations with conversion friendly citations
    for (var y=0; y<reflist.length;y++){
        if (reflist[y].isShort){
            text = text.replace(reflist[y].contents, newrefs[reflist[y].name]["short"]);
            
            //Adjust count number
            newrefs[reflist[y].name].count++;
        }
        else
            text = text.replace(reflist[y].contents, newrefs[reflist[y].name]["long"]);
    }

    return {citations: newrefs, content: text}; 
}

//Function that updates the citation object singleton
function convertReferences(citations){
    console.log("convert");
    console.log(citations);
    for (var x=0; x<Object.keys(citations).length; x++){
        var key = Object.keys(citations)[x];
        console.log("Key " + key);
        if (!citationSingleton.citations[citations[key].id]){
            var citation = new citationObj(citations[key].id, citationSingleton);
            citation.generateCitationFromWikiCitation(citations[key]);
            
            citationSingleton.citations[citations[key].id] = citation;
        }
    }
}

function searchWiki()
{
    var search = encodeURIComponent($("#wikiSearch").val());
    $.ajax( {
        url: "https://en.wikipedia.org/w/api.php?action=query&titles=" + search + "&prop=revisions&rvprop=content&format=json",
        jsonp: "callback", 
        dataType: 'jsonp', 
        xhrFields: { withCredentials: true },
        success: function(data) { 
            if (data.query.pages[Object.keys(data.query.pages)[0]].revisions === undefined){
                $("#wikiSearch").val("Invalid Wikipedia Title");
                $("#wikiSearch").data("error", true);
            }
            else{
                var contents = data.query.pages[Object.keys(data.query.pages)[0]].revisions[0]["*"];

                console.log(contents);
                
                //Partition and set to global footer variable
                footer = getSectionsByName(contents, footerSections);
                
                //Set content to body of Wiki MarkDown (which is the last element of the array) and then remove from footer array
                contents = footer[footer.length-1].content;
                footer.splice(footer.length-1, 1);

                //Extract references from the Wiki mark up
                var reflist = extractReferences(contents);
                console.log(reflist);

                //Convert references to BioCurator form
                var newcontents = convertAndReplaceReferences(reflist, contents);

                //Send to server to convert to HTML
                processByServer(newcontents.content);

                //Add correct citations to citationSingleton
                convertReferences(newcontents.citations);
                
                //Print citations
                console.log(newcontents.citations);
                console.log(citationSingleton);
            }
        }
    });
}

function checkError(){
    if ($("#wikiSearch").data("error")){
        $("#wikiSearch").data("error", false);
        $("#wikiSearch").val("");
    }
}

function processByServer(text){
    $.ajax({
        url: "http://localhost:3000/wikiToHTML",
        type: "post",
        data: {text: encodeURIComponent(text)}, 
        success: function(data){
            fileOpened = true;
            editor.setData(data);     
        }
    });
}