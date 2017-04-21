//Global vars for AJAX search
var search_count = 0;
var retstart = 0;
var itemsPerPage = 20;
var pageNum = 1;
var currentSearch = "";
var highLightLock = false;
var api_connections = {};
var selected_api = "pubmed"; //default selected value

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
    api_connections[selected_api].simpleAndSearch(false); 
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

function toggleSearchType(obj) {
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

function updateAPISelection(selected) {
    selected_api = selected.options[selected.selectedIndex].value;
    console.log(selected.options[selected.selectedIndex].value)
   
}

function initSearch() {
    //var api = Object.create(Uniprot_API_Connection)
    console.log(selected_api);
    api_connections[selected_api].simpleAndSearch(true);
}