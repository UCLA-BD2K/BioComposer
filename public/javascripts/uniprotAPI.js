function initSearch() {
    var api = Object.create(PubMed_API_Connection)
    api.simpleAndSearch(true);
}



var Uniprot_API_Connection = Object.create(APIConnection);

Uniprot_API_Connection.searchSequence = function (value) {
    this.search(value)
        .then(this.parseResults)
      //  .then(this.displayResults);
};


Uniprot_API_Connection.search = function(term) {
    var search_url = 'http://www.uniprot.org/uniprot/?';
    var params = jQuery.param({
        query: term,
        format: 'xml',
        compress: 'no',
        
    });
    //return $.getJSON('https://www.ebi.ac.uk/proteins/api/proteins/P31749');
    return $.get('http://www.uniprot.org/uniprot/P31749.xml');
};

Uniprot_API_Connection.parseResults = function(res) {
    console.log(res);
    var accessionNode = res.querySelector('accession');
    var functionsNodes = res.querySelectorAll('comment[type=function] > text')
    var functions = "";
    functionsNodes.forEach(function (item) {
        functions += item.textContent;
        functions += "\n\n";
    });
    var proteinNameNode = res.querySelector('protein > recommendedName > fullName');
    var geneNameNode = res.querySelector('gene > name[type=primary]');
    console.log('*** GO - Molecular ***');
    var goMolecularNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=F]')
    var goMoleculars = [];
    goMolecularNodes.forEach(function(item) {
        goMoleculars.push({
            id: item.parentNode.getAttribute('id'),
            text: item.getAttribute('value').substring(2)
        });
    });

    console.log('*** GO - Biological ***');
    var goBiologicalNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=P]')
    var goBiologicals = [];
    goBiologicalNodes.forEach( function(item) {
        goBiologicals.push({
            id: item.parentNode.getAttribute('id'),
            text: item.getAttribute('value').substring(2)
        });
    });

    console.log('*** GO - Cellulars ***')
    var goCellularNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=C]')
    var goCellulars = [];
    goCellularNodes.forEach( function(item) {
        goCellulars.push({
            id: item.parentNode.getAttribute('id'),
            text: item.getAttribute('value').substring(2)
        });
    });

    var diseasesNodes = res.querySelectorAll('comment[type=disease]');
    var diseases = [];
    diseasesNodes.forEach(function(item) {
        var nameNode = item.querySelector('disease > name');
        var descriptionNode = item.querySelector('disease > description');
        var textNode = item.querySelector('text');
        diseases.push({
            name: nameNode ? nameNode.textContent : null,
            description: descriptionNode ? descriptionNode.textContent : null,
            text: textNode ? textNode.textContent : null
        });
    });

    var tissueSpecificityNode = res.querySelector('comment[type="tissue specificity"] > text');
    var subunitStructureNode = res.querySelector('comment[type=subunit] > text');
    var seqSimilarityNode = res.querySelector('comment[type=similarity] > text');

    var ret = {
        accession: accessionNode ? accessionNode.textContent : null,
        functions: functions,
        proteinName: proteinNameNode ? proteinNameNode.textContent : null,
        geneName: geneNameNode ? geneNameNode.textContent : null,
        GO_moleculars: goMoleculars, 
        GO_biologicals: goBiologicals,
        GO_cellulars: goCellulars, 
        diseases: diseases,
        tissueSpecificity: tissueSpecificityNode ? tissueSpecificityNode.textContent : null,
        subunitStructure: subunitStructureNode ? subunitStructureNode.textContent : null,
        seqSimilarity: seqSimilarityNode ? seqSimilarityNode.textContent : null
    };
    console.log(ret);

    return ret;
}

/*
PubMed_API_Connection.displayResults = function(articles) {
    if (debugCite)
        console.log(articles);
    
    //Show most recent/relevant element again
    $("#search_type").show();
    
    //Reset HTML elements
    $(".loader")[0].remove();
    $(".results_header").remove();
    $("#pageNext").remove();
    $("#pageNum").remove();
    $("#pagePrev").remove();
    
    //Pubmed container
    var wrapper = $('.results_container')[0];
    var results = $('#pubmed_results').html("");
    
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
        text: numberWithCommas(search_count) + " Results for " + '"' + currentSearch + '"...'
      }).addClass('results_header').prependTo(wrapper);

    //Create each DIV for each article 
    $.each(articles, function (i, article) {
        var alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";
        
        //Basically see if user is clicking for longer that 1500ms which would indicate that it is not a click, but a highlight
        var timeoutId; 
        var highLightLock = false;
        var container = $('<div/>').addClass(alternate).addClass("single_result").click(function(){if (!highLightLock){}}).data("id", article.id).appendTo(results);
        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        authors = "";
        for (var x=0; x<article.authors.length && x<5; x++)
            {
                authors += article.authors[x];
                if (!(x == article.authors.length-1 || x == 4))
                    authors += ", ";
                
                if (x < article.authors.length-1 && x==4)
                    authors += " et al."
            }
        
        //Add data to container
        $(container).data('id', article.id);
        $(container).data('url', encodeURIComponent(article.url));
        $(container).data('title', encodeURIComponent(article.title));
        $(container).data('date', encodeURIComponent(article.date));
        $(container).data('authors', encodeURIComponent(authors));
        $(container).data('publisher', encodeURIComponent(article.source));
        
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
        
        $('<button/>', {
            text: "Reference"
            }).click(function(e){e.stopPropagation(); generateCitation($(this).parent())}).addClass('button').addClass('refButton').appendTo(container);
        
        
        
    });

}*/

/*
PubMed_API_Connection.seeMore = function (obj) {
    //console.log($(obj).has('.abstract').length);
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
        if (debugCite)
            console.log("Called from data");
        var text = decodeURIComponent($(obj).data("abstract"));
        $($(obj).children(".authors")[0]).after(function(){return "<p class='abstract'>" + text + "</p>"});
        $($(obj).children(".abstract")[0]).show("slow");
    }
    else{
        if (ajaxLock == 0){
        fetchAbstract(obj_id).then(display_abstract).then(function(text){
        if (debugCite)
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
    
    return text;
}

PubMed_API_Connection.fetchAbstract = function (id) {
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


*/

