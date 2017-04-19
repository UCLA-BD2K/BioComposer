function initSearch() {
    var api = Object.create(Uniprot_API_Connection)
    api.simpleAndSearch(true);
}

function rotateImg(id) {
    if ($(id).hasClass("rotateArrow"))
        $(id).removeClass("rotateArrow");
    else
        $(id).addClass("rotateArrow");
}

//Helper functions to create and modify info content HTML

function createResultSubheader(id, subheader, parent_container) {
    $('<div/>', {
        class: "result_subheader",
        id: "h_" + id,
        onClick: "$('#container_" + id + "').toggle('fast'); rotateImg('#arrow_"+ id + "');"
    }).appendTo(parent_container);

    $('<p/>', {
        text: subheader,
        float: "left"
    }).appendTo($("#h_" + id));

   $('<img/>', {
        src: "../images/down-arrow-3.png",
        class: "show_more_arrow",
        id: "arrow_"+ id 
   }).appendTo($("#h_" + id));

}

function createInfoText(id, text, parent_container) {
    $('<div/>', {
        id: "container_" + id
    }).appendTo(parent_container);

    $('<p/>', {
        text: text
    }).appendTo($("#container_" + id));

    $("#container_" + id).hide();
 
}

function createInfoListGO(id, list, parent_container) {
    $('<div/>', {
        id: "container_" + id
    }).appendTo(parent_container);

    for (var i = 0; i  < list.length; i++) {
        $('<a/>', {
            href: 'https://www.ebi.ac.uk/QuickGO/GTerm?id=' + list[i].id,
            target: "_blank",
            text: list[i].text
        }).appendTo($("#container_" + id));
        $('<br>').appendTo($("#container_" + id));
    }
    $("#container_" + id).hide();
}

function createInfoDiseases(id, diseases, parent_container) {
    
    $('<div/>', {
        id: "container_" + id
    }).appendTo(parent_container);

    for (var i = 0; i < diseases.length; i++) {
        $('<p/>', {
            text: diseases[i].name + ' - ' + diseases[i].description
        }).appendTo($("#container_" + id));
    }
    $("#container_" + id).hide();
 
}



var Uniprot_API_Connection = Object.create(APIConnection);

Uniprot_API_Connection.searchSequence = function (value) {
    this.search(value)
        .then(this.parseResults)
        .then(this.displayResults);
};


Uniprot_API_Connection.search = function(term) {
    var search_url = 'http://www.uniprot.org/uniprot/?';
    var params = jQuery.param({
        query: "reviewed:yes+"+term,
        format: 'xml',
        compress: 'no',
        limit: "100",
        sort: "score"
    });

    console.log("url:"+search+params);

    return $.get(search_url+params);
};

Uniprot_API_Connection.parseResults = function(res) {
    console.log(res);

    var uniprotNodes = res.querySelectorAll('entry');

    var uniprots = [];

    for (var i = 0; i < uniprotNodes.length; i++) {
        var accessionNode = uniprotNodes[i].querySelector('accession');
        var functionsNodes = uniprotNodes[i].querySelectorAll('comment[type=function] > text')
        var functions = "";

        for (var j = 0; j < functionsNodes.length; j++) {
            functions += functionsNodes[j].textContent;
            functions += "\n\n";
        }

        var proteinNameNode = uniprotNodes[i].querySelector('protein > recommendedName > fullName');
        //var geneNameNode = res.querySelector('gene > name[type=primary]');
        var geneNameNode = uniprotNodes[i].querySelector('name');

        var info = {
            url: accessionNode ? 'http://www.uniprot.org/uniprot/' + accessionNode.textContent : null,
            accession: accessionNode ? accessionNode.textContent : null,
            functions: functions,
            proteinName: proteinNameNode ? proteinNameNode.textContent : null,
            geneName: geneNameNode ? geneNameNode.textContent : null
        };
        uniprots.push(info);

    }

    return uniprots     
}


Uniprot_API_Connection.parseUniprotInfo = function(res) {
    
    var goMolecularNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=F]')
    var goMoleculars = [];
    for (i = 0; i < goMolecularNodes.length; i++) {
        goMoleculars.push({
            id: goMolecularNodes[i].parentNode.getAttribute('id'),
            text: goMolecularNodes[i].getAttribute('value').substring(2)
        });
    }

    var goBiologicalNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=P]')
    var goBiologicals = [];
    for (i = 0; i < goBiologicalNodes.length; i++) {
        goBiologicals.push({
            id: goBiologicalNodes[i].parentNode.getAttribute('id'),
            text: goBiologicalNodes[i].getAttribute('value').substring(2)
        });
    }

    var goCellularNodes = res.querySelectorAll('dbReference[type=GO] > property[type=term][value^=C]')
    var goCellulars = [];
    for (i = 0; i < goCellularNodes.length; i++) {
        goCellulars.push({
            id: goCellularNodes[i].parentNode.getAttribute('id'),
            text: goCellularNodes[i].getAttribute('value').substring(2)
        });
    }

    var diseasesNodes = res.querySelectorAll('comment[type=disease]');
    var diseases = [];
    for (i = 0; i < diseasesNodes.length; i++) {
        var nameNode = diseasesNodes[i].querySelector('disease > name');
        var descriptionNode = diseasesNodes[i].querySelector('disease > description');
        var textNode = diseasesNodes[i].querySelector('text');
        if (nameNode && descriptionNode) {
            diseases.push({
                name: nameNode ? nameNode.textContent : null,
                description: descriptionNode ? descriptionNode.textContent : null,
                text: textNode ? textNode.textContent : null
            }); 
        }
    }

    var tissueSpecificityNode = res.querySelector('comment[type="tissue specificity"] > text');
    var subunitStructureNode = res.querySelector('comment[type=subunit] > text');
    var seqSimilarityNode = res.querySelector('comment[type=similarity] > text');

    var ret = {
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


Uniprot_API_Connection.displayResults = function(uniprots) {
    if (debugCite)
        console.log(uniprots);
    
    //For now, only single uniprot search results

    search_count = uniprots.length;

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

    //Create each DIV for each uniprot 
    for (var i = 0; i < uniprots.length; i++) {
        var uniprot = uniprots[i];
        var alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";
        
        //Basically see if user is clicking for longer that 1500ms which would indicate that it is not a click, but a highlight
        var timeoutId; 
        var highLightLock = false;
        var container = $('<div/>').addClass(alternate).addClass("single_result").click(function(){if (!highLightLock){}}).data("id", uniprot.accession).appendTo(results);
        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        /*
        //Add data to container
        $(container).data('id', article.id);
        $(container).data('url', encodeURIComponent(article.url));
        $(container).data('title', encodeURIComponent(article.title));
        $(container).data('date', encodeURIComponent(article.date));
        $(container).data('authors', encodeURIComponent(authors));
        $(container).data('publisher', encodeURIComponent(article.source));
        */

        $('<a/>', {
            href: uniprot.url,
            target: "_blank"
        }).addClass('result_header').appendTo(container);
        
        //Add escaped html
        $($('.result_header')[i]).html((i+1+retstart) + ". " + unescapeHtml(uniprot.accession));
        
        $('<p/>', {
            text: uniprot.proteinName
        }).addClass('protein_name').appendTo(container);
        
        $('<p/>', {
            text: uniprot.geneName
        }).addClass('gene_name').appendTo(container);
        /*
        $('<button/>', {
            text: "Reference"
            }).click(function(e){e.stopPropagation(); generateCitation($(this).parent())}).addClass('button').addClass('refButton').appendTo(container);
        */
        
      }
  }

    Uniprot_API_Connection.showMoreUniprotInfo = function(uniprot, subheader_id) {
        $.get({
            url: "http://www.uniprot.org/uniprot/"+uniprot,
            success: function(data) {
                var infoContainer = $('<div/>').insertAfter("#"+subheader_id).hide();


                createResultSubheader("functions", "Functions: ", infoContainer);
                createInfoText("functions", uni.functions, infoContainer);
                
                createResultSubheader("go_molecular", "GO - Molecular: ", infoContainer);
                createInfoListGO("go_molecular", uni.GO_moleculars, infoContainer);

                createResultSubheader("go_biological", "GO - Biological: ", infoContainer);
                createInfoListGO("go_biological", uni.GO_biologicals, infoContainer);

                createResultSubheader("go_cellular", "GO - Cellular: ", infoContainer);
                createInfoListGO("go_cellular", uni.GO_cellulars, infoContainer);

                createResultSubheader("diseases", "Diseases: ", infoContainer);
                createInfoDiseases("diseases", uni.diseases, infoContainer);
                
                createResultSubheader("tissue", "Tissue Specificity: ", infoContainer);
                createInfoText("tissue", uni.tissueSpecificity, infoContainer);

                createResultSubheader("subunit_structure", "Subunit Structure: ", infoContainer);
                createInfoText("subunit_structure", uni.subunitStructure, infoContainer);

                createResultSubheader("seq_similarity", "Sequence Similarities: ", infoContainer);
                createInfoText("seq_similarity", uni.seqSimilarity, infoContainer);   

                infoContainer.show("slow");                     
            }
        });
    }



      




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

