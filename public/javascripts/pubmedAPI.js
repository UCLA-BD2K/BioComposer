/*function initSearch() {
    var api = Object.create(PubMed_API_Connection)
    api.startSearch(true);
}*/


var PubMed_API_Connection = Object.create(APIConnection);
api_connections["pubmed"] = PubMed_API_Connection;

PubMed_API_Connection.searchSequence = function (value) {
    this.search(value)
        .then(this.fetchResults)
        .then(this.parseResults)
        .then(this.displayResults);
}

PubMed_API_Connection.seeMore = function (obj) {
    //console.log($(obj).has('.abstract').length);
    if ($(obj).has('.info_container').length > 0) {
        $((obj).children(".info_container")[0]).toggle("slow");            
        return;
    }  
    console.log($(obj))
    var article_id = $(obj).data("id");
    
    if (ajaxLock != 0)
        return;
    console.log(article_id)
    //Loader gif
    $("<img/>", {
        src: "../images/loader.gif"
    }).addClass("info_loader").appendTo($(obj)); 
    
    ajaxLock = 1;

    this.fetchAbstract(article_id)
        .then(function(data){PubMed_API_Connection.display_abstract(data,obj)});
}

PubMed_API_Connection.display_abstract = function (response, obj) {
    var abstract_text = $(response).find('AbstractText');
    var text = "";
    if (abstract_text.length > 1)
        $.each(abstract_text, function (i, abstract) {
            if ($(abstract_text[i]).attr("Label"))
                text += "<b>" + $(abstract_text[i]).attr("Label") + ": </b>";
            text += $(abstract_text[i]).text() + "<br><br>";
        });
    else
        text = abstract_text.text();

    if (text == "")
        text = "[Abstract not available from source]";
             
    var infoContainer = $('<div/>', {
        html: "<p>" + text + "</p>",
        class: 'info_container'
    }).appendTo($(obj)).hide();
    
    infoContainer.show("slow");    
}

PubMed_API_Connection.fetchAbstract = function (id) {
    ajaxLock = 1;
    return $.ajax({
	    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
		data: {
            db: 'pubmed',
		    id: id,
            retmode: "xml"
		},
        success: function() {
            console.log("abstract sucessfully retrieved")
            ajaxLock = 0;
            $(".info_loader")[0].remove();
        },
        error: function() {
            console.log("error retrieving abstract")
            ajaxLock = 0;
            $(".info_loader")[0].remove();
        }
	});
}


PubMed_API_Connection.search = function(term) {
    return $.ajax({
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        data: {
        db: 'pubmed',
            usehistory: 'y',
            term: term,
            sort: search_type,
            retmode: 'json',
            retmax: 0
            },
        success: function() { 
            console.log("Search query success");
            PubMed_API_Connection.resetSearchHTML();
            ajaxLock = 0
        },
        error: function() { 
            console.log("failed");
            PubMed_API_Connection.resetSearchHTML();
            ajaxLock = 0;
        }
    });
};

PubMed_API_Connection.fetchResults = function(response) {
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
};

PubMed_API_Connection.parseResults = function(response) {
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

PubMed_API_Connection.displayResults = function(articles) {
    if (debugCite)
        console.log(articles);
    
    //Show most recent/relevant element again
    $("#search_type").show();
  
    
    //Pubmed container
    var wrapper = $('.results_container')[0];    
    var results = $('#search_results').html("");


    if (articles.length == 0) {
        PubMed_API_Connection.noResults(results);
        return;
    }

    //Create page control buttons
    PubMed_API_Connection.initResultsNavigator(wrapper);

    //Create each DIV for each article 
    $.each(articles, function (i, article) {
        var alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";
        
        //Basically see if user is clicking for longer that 1500ms which would indicate that it is not a click, but a highlight
        var timeoutId; 
        highLightLock = false;
	    var container = $('<div/>', {
            class:  alternate + ' single_result',
            id: article.id,
            click: function() {
                clickSeeMore(this);
            }
        }).appendTo(results);
        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        var authors = "";
        for (var x=0; x<article.authors.length && x<5; x++)
            {
                authors += article.authors[x];
                if (!(x == article.authors.length-1 || x == 4))
                    authors += ", ";
                
                if (x < article.authors.length-1 && x==4)
                    authors += " et al."
            }
        
        article.authors = authors;
        PubMed_API_Connection.setContainerData(container, article);
        //Add escaped html
        var header = $('<div/>', {
            class: 'result_header'
            }).appendTo(container);

  
        var data = {
            bookmark_id: article.id,
            api: "pubmed",
            ref_data: article
        }
        
        var titleContainer = $('<div/>', {
            class: 'title_container'
        }).appendTo(header);
        
        $('<a/>', {
                href: article.url,
                target: "_blank",
                text: (i+1+retstart) + ". " + removeHTMLTags(article.title),
                
        }).appendTo(titleContainer);
        
        generateBookmarkStar(data, header);

	    $('<p/>', {
		    text: authors,
            class: 'authors'
			}).appendTo(container);
        
	    $('<p/>', {
		    text: "Circ Res. " + article.date + ' · ' + article.source,
            class: 'dateSource'
			}).appendTo(container);
        
        $('<button/>', {
		    text: "Reference",
            class: 'button refButton',
            click: function(e){
                clickReference(e, this);
            }
			}).appendTo(container);
        
        
       
	});

}

PubMed_API_Connection.setContainerData = function(container, article) {
    //Add data to container
    $(container).data('type', 'Pubmed');
    $(container).data('id', article.id);
    $(container).data('url', encodeURIComponent(article.url));
    $(container).data('title', encodeURIComponent(article.title));
    $(container).data('date', encodeURIComponent(article.date));
    $(container).data('authors', encodeURIComponent(article.authors));
    $(container).data('publisher', encodeURIComponent(article.source));
}

