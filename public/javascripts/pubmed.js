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
	    var doiNode = node.querySelector('Item[Name=DOI]');
	    var titleNode = node.querySelector('Item[Name=Title]');
	    var sourceNode = node.querySelector('Item[Name=Source]');
	    var epubDateNode = node.querySelector('Item[Name=EPubDate]');
	    var pubDateNode = node.querySelector('Item[Name=PubDate]');
	    var authorNodes = node.querySelectorAll('Item[Name=AuthorList] > Item[Name=Author]');

	    return {
            id: doiNode ? doiNode.textContent : pmidNode.textContent,
		    title: titleNode ? titleNode.textContent : null,
		    source: sourceNode ? sourceNode.textContent : null,
		    authors: $.map(authorNodes, function(authorNode) {
			    return authorNode.textContent;
			}),
		    url: doiNode ? 'http://dx.doi.org/' + encodeURIComponent(doiNode.textContent) : 'http://pubmed.gov/' + pmidNode.textContent,
		    date: epubDateNode && epubDateNode.textContent ? epubDateNode.textContent : pubDateNode.textContent,
            abstract: ""
		    };
	});
}

function fetchAbstract(articles)
{
    //Implement code to fetch abstracts via AJAX query for each article   
}

function displayResults(articles) {
    console.log(articles);
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
        
	    var container = $('<div/>').addClass(alternate).addClass("single_result").appendTo(pubmed);
        
	    $('<h1/>', {
		    href: article.url,
			text: article.title
			}).appendTo(container);

	    $('<p/>', {
		    text: article.authors[0] + " et al., Circ Res. " + article.date + ' · ' + article.source 
			}).addClass('authors').appendTo(container);
        
	    $('<div/>', {
		    text: "[Abstract info not yet available]"
			}).appendTo(container);
	});
}