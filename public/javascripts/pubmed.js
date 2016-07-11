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
        var text = $(obj).data("abstract");
        $($(obj).children(".authors")[0]).after(function(){return "<p class='abstract'>" + text + "</p>"});
        $($(obj).children(".abstract")[0]).show("slow");
    }
    else{
        fetchAbstract(obj_id).then(display_abstract).then(function(text){
            console.log("Called from web");
            $($(obj).children(".authors")[0]).after(function(){return "<p class='abstract'>" + text + "</p>"});
            $($(obj).children(".abstract")[0]).show("slow");

            //Basically cache abstract so we don't have to HTTP request it every time
            $(obj).data("abstract", text);
           
        });
    }
}

function display_abstract(response, obj)
{
    var abstract_text = $(response).find('AbstractText').text();
    if (abstract_text == "")
        abstract_text = "[Abstract not available from source]";
    return abstract_text;
}

function fetchAbstract(id)
{
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
		data: {
		db: 'pubmed',
		    id: id,
            retmode: "xml"
		    }
	});
}


function simpleAndSearch(obj)
{
    var text = obj.value; 
    if (obj.value == "")
        return;
    
    var ret = "";
    for (var x=0; x<text.length;x++)
    {
        if (text[x] == ' ')
            ret += " AND ";
        else
            ret += text[x];
    }

    console.log(ret);
    searchPubMed(ret)
        .then(fetchResults)
        .then(parseResults)
        .then(displayResults);
}



function searchPubMed(term) {
    console.log(term.length);
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
    console.log(response);
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
		data: {
		db: 'pubmed',
		    usehistory: 'y',
		    webenv: response.esearchresult.webenv,
		    query_key: response.esearchresult.querykey,
		    retmode: 'xml',
		    retmax: 20 // how many items to return
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
    $(".results_header").remove();
    var wrapper = $('.results_container')[1];
    var pubmed = $('#pubmed_results').html("");
    
    $('<h1/>',{
        text: "Showing " + articles.length + " results for " + $("#search_bar").val() + "..."
      }).addClass('results_header').prependTo(wrapper);

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
        
	    $('<h1/>', {
		    href: article.url,
			text: article.title
			}).appendTo(container);
        
	    $('<p/>', {
		    text: authors
			}).addClass('authors').appendTo(container);
        
	    $('<p/>', {
		    text: "Circ Res. " + article.date + ' · ' + article.source
			}).addClass('dateSource').appendTo(container);
	});
}