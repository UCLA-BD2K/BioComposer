// Helper function to zero-pad GO id to 7 digit format
function formatGOid(id) {
    // Convert id to type string, if not already
    var result = "" + id;
    // Front pad with 0's until length of 7
    while (result.length < 7) {
        result = '0' + result;
    }
    return result;
}

// Helper function, returns true if GO id already present in list
function listHasGO(list, id) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].id == id)
            return true;
    }
    return false;
}

var Gene_API_Connection = Object.create(APIConnection);
api_connections["gene"] = Gene_API_Connection;

Gene_API_Connection.searchSequence = function (value) {
    this.search(value)
        .then(this.fetchResults)
        .then(this.parseResults)
        .then(this.displayResults);
}


Gene_API_Connection.search = function(term) {
    return $.ajax({
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        data: {
            db: 'gene',
            usehistory: 'y',
            term: term,
            sort: search_type,
            retmode: 'json',
            retmax: 0
            },
        success: function() { 
            console.log("Search query success");
            Gene_API_Connection.resetSearchHTML();
            ajaxLock = 0
        },
        error: function() { 
            console.log("failed");
            $(".search_loader")[0].remove()
            Gene_API_Connection.resetSearchHTML();
            ajaxLock = 0;
        }
    });
};

Gene_API_Connection.fetchResults = function(response) {
    console.log(response);
    search_count = response.esearchresult.count;

    return $.ajax({
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
        data: {
        db: 'gene',
            usehistory: 'y',
            webenv: response.esearchresult.webenv,
            query_key: response.esearchresult.querykey,
            retstart: retstart,
            retmode: 'xml',
            retmax: itemsPerPage // how many items to return
            }
    });
};

Gene_API_Connection.parseResults = function(res) {
    console.log(res);
    if (!res)
        return;

    var geneNodes = res.querySelectorAll('DocumentSummary');
    var genes = [];

    for (var i = 0; i < geneNodes.length; i++) {
        var symbolNode = geneNodes[i].querySelector('Name');
        var fullNameNode = geneNodes[i].querySelector('Description');
        var akaNode = geneNodes[i].querySelector('OtherAliases');
        var id = null;
        var url = null;
        if (geneNodes[i]) {
            id = geneNodes[i].getAttribute("uid");
            url = "https://www.ncbi.nlm.nih.gov/gene/" + id;
        }
        var organismNode = geneNodes[i].querySelector('ScientificName');
        var info = {
            id: id,
            url: url,
            symbol: symbolNode ? symbolNode.textContent : "N/A",
            fullName: fullNameNode ? fullNameNode.textContent : "N/A",
            aka: akaNode ? akaNode.textContent : "N/A",
            organism: organismNode ? organismNode.textContent : null
        }
        genes.push(info);
    }

    return genes;
}

Gene_API_Connection.parseGeneInfo = function(res) {
    if (!res)
        return;

    var summaryNode = res.querySelector('Entrezgene_summary');
    var locationNode = res.querySelector('Maps_display-str');
    var tmpNodes = res.querySelectorAll('Gene-commentary_type[value=property]');
    var exonNode = null;
    // Search for Exon Count node
    for (var i = 0; i < tmpNodes.length; i++) {
        var parentNode = tmpNodes[i].parentNode;
        var labelNode = parentNode.querySelector('Gene-commentary_label');
        if (labelNode && labelNode.textContent == "Exon count") {
            exonNode = parentNode.querySelector('Gene-commentary_text');
            break;
        }
    }

    tmpNodes = res.querySelectorAll('Gene-commentary_type[value=comment]');

    var GO_lists = [];
    // Search for GO nodes
    for (var i = 0; i < tmpNodes.length; i++) {
        var parentNode = tmpNodes[i].parentNode;
        var labelNode = parentNode.querySelector('Gene-commentary_heading');
        if (labelNode && labelNode.textContent == "GeneOntology") {
            var nodes = parentNode.querySelector('Gene-commentary_comment').children;
            for (var j = 0; j < nodes.length; j++) {
                var typeNode = nodes[j].querySelector('Gene-commentary_label');
                if (!typeNode)
                    continue;
                var list = {
                    type: typeNode.textContent,
                    items: []
                }
                var itemNodes = nodes[j].querySelectorAll('Gene-commentary_comment > Gene-commentary');
                for (var k = 0; k < itemNodes.length; k++) {
                    var idNode = itemNodes[k].querySelector('Object-id_id');
                    var textNode = itemNodes[k].querySelector('Other-source_anchor');
                    var item = {
                        id: idNode ? formatGOid(idNode.textContent) : "N/A",
                        text: textNode ? textNode.textContent : "N/A"
                    }

                    // Check if GO is already present 
                    // (prevent duplicates because of multiple sources)
                    if (!listHasGO(list.items, item.id))
                        list.items.push(item);
                }
                GO_lists.push(list);
            }
            break;
        }
    }

    var nameNodes = res.querySelectorAll('Prot-ref_name_E');
    var prefNameNodes = res.querySelectorAll('Prot-ref_desc');

    var names = [];
    var prefNames = [];
    for (var i = 0; i < nameNodes.length; i++) {
        names.push(nameNodes[i].textContent);
    }
    for (var i = 0; i < prefNameNodes.length; i++) {
        prefNames.push(prefNameNodes[i].textContent);
    }

    var info = {
        summary: summaryNode ? summaryNode.textContent : "N/A",
        location: locationNode ? locationNode.textContent : "N/A",
        exonCount: exonNode ? exonNode.textContent : "N/A",
        GO_lists: GO_lists,
        names: names,
        prefNames: prefNames
    }

    console.log(info);

    return info;
}

Gene_API_Connection.displayResults = function(genes) {
    if (debugCite)
        console.log(genes);
    
    //Show most recent/relevant element again
    $("#search_type").show();
  
    
    //Pubmed container
    var wrapper = $('.results_container')[0];    
    var results = $('#search_results').html("");


    if (genes.length == 0) {
        Gene_API_Connection.noResults(results);
        return;
    }

    //Create page control buttons
    Gene_API_Connection.initResultsNavigator(wrapper);

    //Create each DIV for each uniprot 
    for (var i = 0; i < genes.length; i++) {
        var gene = genes[i];
        var alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";
        
        //Basically see if user is clicking for longer that 1500ms which would indicate that it is not a click, but a highlight
        var timeoutId; 
        highLightLock = false;
        var container = $('<div/>', {
            class: alternate +' single_result',
            id: gene.id,
            click: function() {
                clickSeeMore(this);
            }
        }).appendTo(results);

        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        var header = $('<div/>', {
            class: 'result_header'
        }).appendTo(container);

        Gene_API_Connection.setContainerData(container, gene);

        var data = {
            bookmark_id: gene.id,
            api: "gene",
            ref_data: gene
        }

        var titleContainer = $('<div/>', {
            class: 'title_container'
        }).appendTo(header);

        $('<a/>', {
                href: gene.url,
                target: "_blank",
                text: (i+1+retstart) + ". " + removeHTMLTags(gene.symbol),
        }).appendTo(titleContainer);
    
        generateBookmarkStar(data, header);

       
        $('<p/>', {
            text: gene.fullName
        }).appendTo(container);
        
        $('<p/>', {
            text: "Also known as: " + gene.aka
        }).appendTo(container);
        
        $('<button/>', {
            text: "Reference",
            class: 'button refButton',
            click: function(e){
                clickReference(e, this);
            }
            }).appendTo(container);
        
    }
}

Gene_API_Connection.seeMore = function(obj) {
    var gene = $(obj).data("id");
   
    if ($(obj).has('.info_container').length > 0)
    {
        $((obj).children(".info_container")[0]).toggle("slow");            
        return;
    }       

    if (ajaxLock != 0)
        return;

     //Loader gif
    $("<img/>", {
        src: "../images/loader.gif"
    }).addClass("info_loader").appendTo($(obj)); 

    ajaxLock = 1;

    $.get({
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
        data: {
            db: 'gene',
            id: gene,
            retmode: "xml"
        },
        success: function(data) {
            console.log(data);
            ajaxLock = 0;

            var info = Gene_API_Connection.parseGeneInfo(data);
            var infoContainer = $('<div/>', {
                class: 'info_container',
                click: function(e) {
                    e.stopPropagation();
                }
            }).appendTo($(obj)).hide();

            createResultSubheader("summary", gene, "Summary: ", infoContainer);
            createInfoText("summary", gene, info.summary, infoContainer);

            createResultSubheader("genomic_context", gene, "Genomic Context: ", infoContainer);
            createInfoText("genomic_context", gene, "Location: " + info.location +
                "<br>Exon Count: " + info.exonCount, infoContainer);

            for (var i = 0; i < info.GO_lists.length; i++) {
                createResultSubheader(info.GO_lists[i].type, gene, "GO - " + info.GO_lists[i].type + ":", infoContainer);
                createInfoListGO(info.GO_lists[i].type, "http://amigo.geneontology.org/amigo/term/GO:",
                    gene, info.GO_lists[i].items, infoContainer);
            }

            var proteinInfoString = "";
            if (info.prefNames.length > 0) {
                proteinInfoString += "Prefered names: ";
                for (var i = 0; i < info.prefNames.length; i++) {
                    proteinInfoString += "<br>" + info.prefNames[i];
                }
                proteinInfoString += "<br><br>";
            }

            if (info.names.length > 0) {
                proteinInfoString += "Names: " ;
                for (var i = 0; i < info.names.length; i++) {
                    proteinInfoString += "<br>" + info.names[i];
                }
            }

            if (proteinInfoString.length > 0) {
                createResultSubheader("protein_info", gene, "General Protein Info: ", infoContainer);
                createInfoText("protein_info", gene, proteinInfoString, infoContainer);
            }

            $(".info_loader")[0].remove();
            infoContainer.show("slow");               
            console.log("showing info");   
        },
        error: function() { 
            ajaxLock = 0;
            $(".info_loader")[0].remove();                
            console.log("error requesting gene info");   
        },
        timeout: 5000
    });
}

Gene_API_Connection.setContainerData = function(container, gene) {
    //Add data to container
    $(container).data('type', 'Gene');
    $(container).data('id', gene.id);
    $(container).data('url', encodeURIComponent(gene.url));
    $(container).data('title', [gene.fullName, gene.organism].join(' - '));
    $(container).data('website', "NCBI");
    
}

