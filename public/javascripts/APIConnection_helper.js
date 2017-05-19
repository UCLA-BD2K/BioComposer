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
    api_connections[selected_api].startSearch(false); 
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

function removeHTMLTags(html) {
    return html.replace(/(<([^>]+)>)/ig,"");
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
    // Don't update global variable
    var selected_api = selected.options[selected.selectedIndex].value;
    console.log(selected_api);
    
    // Set default value of sort type
    if ($($("#search_type").find("p")[0]).text() == "Most Recent") {
        if (selected_api == "gene")
            toggleSearchType($("#search_type"));
    }
    else {
        if (selected_api == "pubmed")
            toggleSearchType($("#search_type"));
    }

    // Hide sort type option for uniprot and bookmarks
    if (selected_api == "uniprot" || selected_api == "bookmark")
        $("#search_type").hide(); 
    else
        $("#search_type").show()

    // If bookmarks, init search immediately
    if (selected_api == "bookmark")
        api_connections[selected_api].startSearch(true, false);
}

function requestSearch() {
    //var api = Object.create(Uniprot_API_Connection)
    selected_api =  $('#API_selection').val();
    console.log(selected_api);
    api_connections[selected_api].startSearch(true);
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

function generateBookmarkStar(data, appendingTo) {
    $('<div/>', {
            html: $('<input/>', { 
                class: "star",
                type: "checkbox",
                click: function(e) {
                    e.stopPropagation();
                    console.log(data);
                    if (this.checked) {
                        let reference = $(this).parents().eq(2).clone();
                        // Only save result_header portion
                        if (reference.has('.info_container').length)
                            reference.children(".info_container")[0].remove();
                        // add bookmark star when bookmark is loaded
                        reference.find(".star_container")[0].remove();
                        // remove numbering from title
                        let text = $(reference.find("a")[0]).text();
                        $(reference.find("a")[0]).text(text.substring(text.indexOf('.') + 2));
                        data.html_content = reference.html(), 
                        bookmarkController.addBookmark(data);
                    }
                    else {
                        bookmarkController.removeBookmark(data);
                    }
                }
                }),
            class: "star_container"
        }).appendTo($(appendingTo));
}

/* HTML elements 'click' function helpers */
function clickSeeMore(obj, api) {
    if (api)
        api_connections[api].seeMore($(obj))
    else if (!highLightLock)
        api_connections[selected_api].seeMore($(obj));
}

function clickReference(e, obj) {
    e.stopPropagation();
    generateCitation($(obj).parent())
}
