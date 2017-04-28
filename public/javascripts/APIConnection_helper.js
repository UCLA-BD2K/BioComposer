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

function startSearch() {
    //var api = Object.create(Uniprot_API_Connection)
    console.log(selected_api);
    api_connections[selected_api].simpleAndSearch(true);
}


function rotateImg(id) {
    if ($(id).hasClass("rotateArrow"))
        $(id).removeClass("rotateArrow");
    else
        $(id).addClass("rotateArrow");
}


//Helper functions to create and modify results info content HTML

function createResultSubheader(section, id, subheader, parent_container) {
    $('<div/>', {
        class: "result_subheader",
        id: "h_" + id+ "_" + section,
        onClick: "$('#container_" + id+ "_" + section + 
        "').toggle('slow'); rotateImg('#arrow_"+ id+ "_" + section + "');"
    }).appendTo(parent_container);

    $('<p/>', {
        text: subheader,
        float: "left"
    }).appendTo($("#h_" + id+ "_" + section));

   $('<img/>', {
        src: "../images/down-arrow-3.png",
        class: "show_more_arrow",
        id: "arrow_"+ id+ "_" + section 
   }).appendTo($("#h_" + id+ "_" + section));

}

function createInfoText(section, id, text, parent_container) {
    $('<div/>', {
        id: "container_" + id+ "_" + section
    }).appendTo(parent_container);

    $('<p/>', {
        html: text
    }).appendTo($("#container_" + id+ "_" + section));

    $("#container_" + id+ "_" + section).hide();
 
}

function createInfoListGO(section, url, id, list, parent_container) {
    $('<div/>', {
        id: "container_" + id+ "_" + section
    }).appendTo(parent_container);

    for (var i = 0; i  < list.length; i++) {
        $('<a/>', {
            href: url + list[i].id,
            target: "_blank",
            text: list[i].text
        }).appendTo($("#container_" + id+ "_" + section));
        $('<br>').appendTo($("#container_" + id+ "_" + section));
    }
    $("#container_" + id+ "_" + section).hide();
}

function createInfoDiseases(section, id, diseases, parent_container) {
    
    $('<div/>', {
        id: "container_" + id + "_" + section
    }).appendTo(parent_container);

    for (var i = 0; i < diseases.length; i++) {
        $('<p/>', {
            text: diseases[i].name + ' - ' + diseases[i].description
        }).appendTo($("#container_" + id + "_" + section));
    }
    $("#container_" + id + "_" + section).hide();
 
}
