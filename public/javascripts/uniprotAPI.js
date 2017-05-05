
var Uniprot_API_Connection = Object.create(APIConnection);
Uniprot_API_Connection.pageNum = 1;
api_connections["uniprot"] = Uniprot_API_Connection;

Uniprot_API_Connection.searchSequence = function (value) {
    this.search(value)
        .then(this.parseResults)
        .then(this.displayResults);
};


Uniprot_API_Connection.search = function(term) {
    var search_url = 'http://www.uniprot.org/uniprot/?';
 
    return $.get({
        url: search_url,
        data: {
            query: term,
            format: 'xml',
            compress: 'no',
            offset: retstart,
            limit: itemsPerPage,
            sort: 'score'
        },
        success: function() { 
            console.log("Search query success");
            Uniprot_API_Connection.resetSearchHTML();
            ajaxLock = 0
        },
        error: function() { 
            console.log("failed");
            Uniprot_API_Connection.resetSearchHTML();
            ajaxLock = 0;
        }
        });
};

Uniprot_API_Connection.parseResults = function(res) {
    console.log(res);
    if (!res)
        return;

    var uniprotNodes = res.querySelectorAll('entry');

    var uniprots = [];

    for (var i = 0; i < uniprotNodes.length; i++) {
        var accessionNode = uniprotNodes[i].querySelector('accession');

        var proteinNameNode = uniprotNodes[i].querySelector('protein > recommendedName > fullName');
        //var geneNameNode = res.querySelector('gene > name[type=primary]');
        var geneNameNode = uniprotNodes[i].querySelector('name');

        var info = {
            url: accessionNode ? 'http://www.uniprot.org/uniprot/' + accessionNode.textContent : null,
            accession: accessionNode ? accessionNode.textContent : null,
            proteinName: proteinNameNode ? proteinNameNode.textContent : null,
            geneName: geneNameNode ? geneNameNode.textContent : null
        };
        uniprots.push(info);

    }

    return uniprots     
}


Uniprot_API_Connection.parseUniprotInfo = function(res) {
    console.log(res);

    var functionsNodes = res.querySelectorAll('comment[type=function] > text')
    var functions = "N/A";

    if (functionsNodes && functionsNodes.length > 0) {
        functions = "";
        for (var j = 0; j < functionsNodes.length; j++) {
            functions += functionsNodes[j].textContent;
            functions += "\n\n";
        }
    }

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
        functions: functions,
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
        
    //Results container
    var wrapper = $('.results_container')[0];
    var results = $('#search_results').html("");

    if (!uniprots || uniprots.length == 0) {
        if (pageNum > 1)
            // No more results, go back to previous page
            movePage(-1);
        else
            // Search term has no results
            Uniprot_API_Connection.noResults(results);
        return;
    }

    search_count = uniprots.length;
    
    //Create page control buttons
    Uniprot_API_Connection.initResultsNavigator(wrapper);

    if (uniprots.length < itemsPerPage) {
        // If not results panel not filled, disable pageNext
        $('#pageNext').unbind('click');
        // If first page, disable pagePrev
        if (pageNum == 1)
            $('#pagePrev').unbind('click');
    }

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
        highLightLock = false;
        var container = $('<div/>', {
            class: "single_result " + alternate,
            id: i
        }).appendTo(results);

        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        var header = $('<div/>').click(function(){if (!highLightLock){Uniprot_API_Connection.showMoreUniprotInfo($(this));}})
        .data("id", uniprot.accession).appendTo(container);

        $('<a/>', {
            href: uniprot.url,
            target: "_blank",
            class: 'result_header'
        }).appendTo(header);
        
        //Add escaped html
        $($('.result_header')[i]).html((i+1+retstart) + ". " + unescapeHtml(uniprot.accession));
        
        $('<p/>', {
            text: uniprot.proteinName
        }).addClass('protein_name').appendTo(header);
        
        $('<p/>', {
            text: uniprot.geneName
        }).addClass('gene_name').appendTo(header);
        /*
        $('<button/>', {
            text: "Reference"
            }).click(function(e){e.stopPropagation(); generateCitation($(this).parent())}).addClass('button').addClass('refButton').appendTo(container);
        */
        
      }
  }

Uniprot_API_Connection.showMoreUniprotInfo = function(prev_div) {
    var uniprot = $(prev_div).data("id");
    console.log($(prev_div).siblings('.info_container').length);
    if ($(prev_div).siblings('.info_container').length > 0)
    {
        $((prev_div).siblings(".info_container")[0]).toggle("slow");            
        return;
    }       

    if (ajaxLock != 0)
        return;

     //Loader gif
    $("<img/>", {
        src: "../images/loader.gif"
    }).addClass("info_loader").appendTo($(prev_div).parent()); 

    ajaxLock = 1;

    $.get({
        url: "http://www.uniprot.org/uniprot/"+uniprot+".xml",
        success: function(data) {
            ajaxLock = 0;
            var uni = Uniprot_API_Connection.parseUniprotInfo(data);
            var infoContainer = $('<div/>').addClass('info_container').appendTo($(prev_div).parent()).hide();

            createResultSubheader("functions", uniprot, "Functions: ", infoContainer);
            createInfoText("functions", uniprot, uni.functions, infoContainer);

            if (uni.GO_moleculars.length > 0) {
                createResultSubheader("go_molecular", uniprot, "GO - Molecular: ", infoContainer);
                createInfoListGO("go_molecular", "https://www.ebi.ac.uk/QuickGO/GTerm?id=",
                    uniprot, uni.GO_moleculars, infoContainer);
            }                
            if (uni.GO_biologicals.length > 0) {
                createResultSubheader("go_biological", uniprot, "GO - Biological: ", infoContainer);
                createInfoListGO("go_biological", "https://www.ebi.ac.uk/QuickGO/GTerm?id=",
                    uniprot, uni.GO_biologicals, infoContainer);
            }
            if (uni.GO_cellulars.length > 0) {
                createResultSubheader("go_cellular", uniprot, "GO - Cellular: ", infoContainer);
                createInfoListGO("go_cellular", "https://www.ebi.ac.uk/QuickGO/GTerm?id=",
                    uniprot, uni.GO_cellulars, infoContainer);
            }
            if (uni.diseases.length > 0) {
                createResultSubheader("diseases", uniprot, "Diseases: ", infoContainer);
                createInfoDiseases("diseases", uniprot, uni.diseases, infoContainer);
            }
            if (uni.tissueSpecificity) {
                createResultSubheader("tissue", uniprot, "Tissue Specificity: ", infoContainer);
                createInfoText("tissue", uniprot, uni.tissueSpecificity, infoContainer);
            }
            if (uni.subunitStructure) {
                createResultSubheader("subunit_structure", uniprot, "Subunit Structure: ", infoContainer);
                createInfoText("subunit_structure", uniprot, uni.subunitStructure, infoContainer);
            }
            if (uni.seqSimilarity) {
                createResultSubheader("seq_similarity", uniprot, "Sequence Similarities: ", infoContainer);
                createInfoText("seq_similarity", uniprot, uni.seqSimilarity, infoContainer);   
            }
           
            $(".info_loader")[0].remove();
            infoContainer.show("slow");               
            console.log("showing info");      
        },
        error: function() { 
            ajaxLock = 0;
            $(".info_loader")[0].remove(); 
        },
        timeout: 5000
    });
}

// Override resetSearchHTML - Hide search type for Uniprot DB 
Uniprot_API_Connection.resetSearchHTML = function() {
    APIConnection.resetSearchHTML();
    $("#search_type").hide();
}


// Override page navigation
Uniprot_API_Connection.initResultsNavigator = function(wrapper) {
        //Create page control buttons
        $('<p/>', {
            text: "NEXT"
        }).attr("id", "pageNext").click(function(){Uniprot_API_Connection.movePage(1);}).prependTo(wrapper);
        
        $('<p/>', {
            text: "PREVIOUS"
        }).attr("id", "pagePrev").click(function(){Uniprot_API_Connection.movePage(-1);}).prependTo(wrapper);
        
         $('<p/>', {
            text: "Page " + pageNum 
        }).attr("id", "pageNum").prependTo(wrapper);
        
        $('<h1/>',{
            text: "Results for " + '"' + currentSearch + '"...'
          }).addClass('results_header').prependTo(wrapper);
}

// Use "this" movePage and not the helper function for Uniprot API
Uniprot_API_Connection.movePage = function(x) {
    if (pageNum == 1 && x < 0)
        return;
    pageNum += x;
    retstart += x*itemsPerPage; 
    this.startSearch(false); 
}

