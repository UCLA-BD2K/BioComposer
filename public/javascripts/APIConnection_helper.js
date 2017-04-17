//Global vars for AJAX search
var search_count = 0;
var retstart = 0;
var itemsPerPage = 20;
var pageNum = 1;
var currentSearch = "";

var pubDebug = 0;

//When set to one, search by relevance
var search_type = "recent";

//Lock to prevent too many reuqests
var ajaxLock = 0;

//----- Functions to change page -------- //
function movePage(x)
{
    //Do nothing if out of bounds
    if ((x==-1 && pageNum==1) || (x==1 && pageNum == Math.ceil(search_count/itemsPerPage)))
        return;
    pageNum += x;
    retstart += x*itemsPerPage; 
    simpleAndSearch(false); 
}

//----- HELPER FUNCTIONS
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function unescapeHtml(safe) {
    return safe.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}
//------------------------

function toggleSearchType(obj)
{
    var ele = $(obj).find("p")[0];
    if(pubDebug)
        console.log(ele);
    if ($(ele).text() == "Most Recent")
    {
        $(ele).text("Most Relevant");
        search_type = "relevance";
    }
    else
    {
        $(ele).text("Most Recent");
        search_type = "recent";
    }
}