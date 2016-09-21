var footerSections = ["References", "Further reading", "See also", "External links", "Recommended reading"];
//Objects we create to store section data and lossy Wiki code
var sections;
var beginningCode = "";
var images; //Array to store images

var x = 0;
//These helper functions help partition MarkDown

//Obtain Beginning code
function getArticleBeginningCode(article){
    //Matches contiguous wikicode and comments
    var codeRegEx = /(((<!--[^->]+-->)*{{[^{}]+}}(<!--[^->]+-->)*(\n)*)+)/g; 
    var intro = article.match(codeRegEx)[0];
    return intro;
}

//Obtain Main Sections
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
            newRef["long"] = "<a class='long" + id + "' href=\"" + encodeURIComponent(reftext) + "\" data-id='" + id + "'>|sup data-id='" + id + "'|[" + uniqueRefNum + "]|/sup|</a>";
            newRef["short"] = "<a class='short" + id + "' href=\"" + encodeURIComponent(shortreftext) + "\" data-id='" + id + "'>|sup data-id='" + id + "'|[" + uniqueRefNum + "]|/sup|</a>";
            newRef["complete"] = true;
            newRef["count"] = 1;
            newRef["supTag"] = "<sup data-id='" + id + "'>[" + uniqueRefNum + "]</sup></a>";
            newRef["supTagReplace"] = "<sup>[" + uniqueRefNum + "]</sup></a>";

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
        else{
            text = text.replace(reflist[y].contents, newrefs[reflist[y].name]["long"]);
            //console.log("REPLACED WITH: " + newrefs[reflist[y].name]["long"]);
        }
    }

    return {citations: newrefs, content: text}; 
}

//Function that updates the citation object singleton
function convertReferences(citations){
    // console.log("convert");
    // console.log(citations);
    //this is working fine
    for (var x=0; x<Object.keys(citations).length; x++){
        var key = Object.keys(citations)[x];
        // console.log("Key " + key);
        if (!citationSingleton.citations[citations[key].id]){
            var citation = new citationObj(citations[key].id, citationSingleton);
            citation.generateCitationFromWikiCitation(citations[key]);
            
            citationSingleton.citations[citations[key].id] = citation;
        }
    }
}

//In order to preserver images, we will replace all [[FILE:...]] objects with ##IMG1##, ##IMG2##, etc. as placeholders
function imagePreservation(article){
    var imageRegex = /\[\[\s*File:.*\]\]/g;
    images = article.match(imageRegex);
    if (images != null){
    for (var x=0;x<images.length;x++){
        article = article.replace(images[x], "||IMG" + x + "||");
    }}
    return article;
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
                
                //DEBUG VIEW
                // console.log("SearchWiki returns stuff below");
                // console.log(contents);
                // This part works
                //Reset document citations
                citationSingleton.clear();
                
                //Set title
                $("#document_title").val(decodeURIComponent(search)).change();
                
                //Get code before article
                beginningCode = getArticleBeginningCode(contents);
                
                //Preserve the images in article (convert to form ##IMG[NUM]##)
                contents = imagePreservation(contents);

                // console.log("contents after image preservation");
                // console.log(contents);
                // contents are fine here

                console.log("footer sections are");
                console.log(footerSections);
                //Partition and set to global footer variable
                sections = getSectionsByName(contents, footerSections);

                console.log("sections are");
                console.log(sections);

                //Set content to body of Wiki MarkDown (which is the last element of the array) and then remove from footer array
                contents = sections[sections.length-1].content;

                console.log("contents after choosing them from sections");
                console.log(contents);

                sections.splice(sections.length-1, 1);

                //Extract references from the Wiki mark up
                var reflist = extractReferences(contents);
                console.log(reflist);

                //Convert references to BioCurator form
                var newcontents = convertAndReplaceReferences(reflist, contents);
                console.log("convert and Replace references returns");
                console.log(newcontents);
                //Send to server to convert to HTML
                processByServer(newcontents);

                //Add correct citations to citationSingleton
                convertReferences(newcontents.citations);
                
                //Print citations
                //console.log(newcontents.citations);
                //console.log(citationSingleton);
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

//SOLUTION TO LINK PROBLEM:
//FIND A WAY TO CHANGE THE ':' TO '\:' IN LINKS AND THEN BACK AGAIN
/**
 * process by server
 * @param obj : a list of references and content
 */

function processByServer(obj){
    console.log("object received by the processByserver is");
    console.log(obj);

    var object = {text: encodeURIComponent(obj.content)}; //, citations:obj.citations}
    console.log("object sent to ajax localhost - process by server");
    console.log(object);
    $.ajax({
        url: "/wikiToHTML",
        type: "post",
        data: {object: object}, 
        fail: function(err){
            console.log(err);
        },
        success: function(data){
            fileOpened = true;
            console.log("process by server data is logged");
            console.log(data); // this is undefined
            
            var tmpDiv = $('<div />', {html:data});
            console.log("tmp div is = ");
            console.log(tmpDiv);
            var anchors = $(tmpDiv).find("a");
            
            //Fix things that cause weird reference bugs
            $.each(anchors, function (i, anchor) {
                //Replace ":" with "\:" to avoid weird bug
                $(anchor).attr("href", $(anchor).attr("href").replace(/:/g, "\\:"));
            }); 
            
            var wikiEditorContent = $(tmpDiv).html();

        
            editor.setData(wikiEditorContent);
        }
    });
}