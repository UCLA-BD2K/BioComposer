//Global vars for AJAX search
var search_count = 0;
var retstart = 0;
var itemsPerPage = 20;
var pageNum = 1;
var currentSearch = "";

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


function seeMore(obj)
{
    console.log($(obj).has('.abstract').length);
    if ($(obj).has('.abstract').length)
    {
        $((obj).children(".abstract")[0]).hide("slow", function(){
            $((obj).children(".abstract")[0]).remove();
        });
        
        return;
    }
    
    var obj_id = $(obj).data("id");
    
    if ($(obj).data("abstract"))
    {
        console.log("Called from data");
        var text = decodeURIComponent($(obj).data("abstract"));
        $($(obj).children(".authors")[0]).after(function(){return "<p class='abstract'>" + text + "</p>"});
        $($(obj).children(".abstract")[0]).show("slow");
    }
    else{
        if (ajaxLock == 0){
        fetchAbstract(obj_id).then(display_abstract).then(function(text){
            console.log("Called from web");
            $($(obj).children(".authors")[0]).after(function(){return "<p class='abstract'>" + text + "</p>"});
            $($(obj).children(".abstract")[0]).show("slow");

            //Basically cache abstract so we don't have to HTTP request it every time and encode to maintain html tags
            $(obj).data("abstract", encodeURIComponent(text));
            ajaxLock = 0;
        });
        }
    }
}

function display_abstract(response, obj)
{
    var abstract_text = $(response).find('AbstractText');
    var text = "";
    if (abstract_text.length > 1)
        $.each(abstract_text, function (i, abstract) {
             text += "<b>" + $(abstract_text[i]).attr("Label") + ": </b>" + $(abstract_text[0]).text() + "<br><br>";
        });
    else
        text = abstract_text.text();

    if (text == "")
        text = "[Abstract not available from source]";
    
    return text;
}

function fetchAbstract(id)
{
    ajaxLock = 1;
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
		data: {
		db: 'pubmed',
		    id: id,
            retmode: "xml"
		    }
	});
}

function simpleAndSearch(newSearch)
{
    if ($(".loader").length == 0){
    var obj = document.getElementById('search_bar');
    var text = obj.value; 
    if (obj.value == "")
        return;
    
    var ret = "";
        
    //Set search variables
    if (newSearch)
    {
        retstart = 0;
        pageNum = 1;
        currentSearch = text;
    }
    else    
        text = currentSearch;
        
    console.log(text);
        
    for (var x=0; x<text.length;x++)
    {
        if (text[x] == ' ')
            ret += " AND ";
        else
            ret += text[x];
    }
    
    $("<img/>", {
        src: "../images/loader.gif"
    }).addClass("loader").appendTo($("#search_wrap")); 
    
    searchPubMed(ret)
        .then(fetchResults)
        .then(parseResults)
        .then(displayResults);
    }
}



function searchPubMed(term) {
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
		data: {
		db: 'pubmed',
		    usehistory: 'y',
		    term: term,
		    retmode: 'json',
		    retmax: 0
		    }
	});
}

function fetchResults(response) {
    search_count = response.esearchresult.count;
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
		data: {
		db: 'pubmed',
		    usehistory: 'y',
		    webenv: response.esearchresult.webenv,
		    query_key: response.esearchresult.querykey,
            retstart: retstart,
		    retmode: 'xml',
		    retmax: itemsPerPage // how many items to return
		    }
	});
}

function parseResults(response) {
    var nodes = response.querySelectorAll('DocSum');
    return $.map(nodes, function(node) {
	    var pmidNode = node.querySelector('Id');
	    var titleNode = node.querySelector('Item[Name=Title]');
	    var sourceNode = node.querySelector('Item[Name=Source]');
	    var epubDateNode = node.querySelector('Item[Name=EPubDate]');
	    var pubDateNode = node.querySelector('Item[Name=PubDate]');
	    var authorNodes = node.querySelectorAll('Item[Name=AuthorList] > Item[Name=Author]');

	    return {
            id: pmidNode.textContent,
		    title: titleNode ? titleNode.textContent : null,
		    source: sourceNode ? sourceNode.textContent : null,
		    authors: $.map(authorNodes, function(authorNode) {
			    return authorNode.textContent;
			}),
		    url: 'http://pubmed.gov/' + pmidNode.textContent,
		    date: epubDateNode && epubDateNode.textContent ? epubDateNode.textContent : pubDateNode.textContent,
		    };
	});
}

function displayResults(articles) {
    console.log(articles);
    
    //Reset HTML elements
    $(".loader")[0].remove();
    $(".results_header").remove();
    $("#pageNext").remove();
    $("#pageNum").remove();
    $("#pagePrev").remove();
    
    //Pubmed container
    var wrapper = $('.results_container')[0];
    var pubmed = $('#pubmed_results').html("");
    
    //Create page control buttons
    $('<p/>', {
        text: "NEXT"
    }).attr("id", "pageNext").click(function(){movePage(1)}).prependTo(wrapper);
    
    $('<p/>', {
        text: "PREVIOUS"
    }).attr("id", "pagePrev").click(function(){movePage(-1)}).prependTo(wrapper);
    
     $('<p/>', {
        text: "Page " + pageNum + " of " + numberWithCommas(Math.ceil(search_count/itemsPerPage))
    }).attr("id", "pageNum").prependTo(wrapper);
    
    $('<h1/>',{
        text: numberWithCommas(search_count) + " results for " + "'" + currentSearch + "'..."
      }).addClass('results_header').prependTo(wrapper);

    //Create each DIV for each article 
    $.each(articles, function (i, article) {
        var alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";
        
	    var container = $('<div/>').addClass(alternate).addClass("single_result").click(function(){seeMore($(this))}).data("id", article.id).appendTo(pubmed);
        
        authors = "";
        for (var x=0; x<article.authors.length && x<5; x++)
            {
                authors += article.authors[x];
                if (!(x == article.authors.length-1 || x == 4))
                    authors += ", ";
                
                if (x < article.authors.length-1 && x==4)
                    authors += " et al."
            }
        
	    $('<a/>', {
		    href: article.url,
            target: "_blank"
			}).addClass('article_title').appendTo(container);
        
        //Add escaped html
        $($('.article_title')[i]).html((i+1+retstart) + ". " + unescapeHtml(article.title));
        
	    $('<p/>', {
		    text: authors
			}).addClass('authors').appendTo(container);
        
	    $('<p/>', {
		    text: "Circ Res. " + article.date + ' · ' + article.source
			}).addClass('dateSource').appendTo(container);
        
        
        
	});
}