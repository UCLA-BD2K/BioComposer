var APIConnection = {

    search_options: {},
    fetch_options: {},

    resetSearchHTML: function() {
        //Show most recent/relevant element again
        $("#search_type").show();
        
        //Reset HTML elements
        $(".search_loader")[0].remove();
        $(".results_header").remove();
        $("#pageNext").remove();
        $("#pageNum").remove();
        $("#pagePrev").remove();
        $('#pubmed_results').html("");
    },
    
    simpleAndSearch: function(newSearch) {
        if (ajaxLock != 0)
            return;

        ajaxLock = 1;

        if ($(".search_loader").length == 0){
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
        if (debugCite)   
            console.log(text);
            
        for (var x=0; x<text.length;x++)
        {
            if (text[x] == ' ')
                ret += " AND ";
            else
                ret += text[x];
        }
        
        //Loader gif
        $("<img/>", {
            src: "../images/loader.gif"
        }).addClass("search_loader").appendTo($("#search_wrap")); 
            
        $("#search_type").hide();
        
        this.searchSequence(ret)
        //    .then(this.fetchResults)
        //    .then(this.parseResults)
        //    .then(this.displayResults);
        }
    },

    searchSequence: function(value) {
        
    },

    noResults: function(obj) {
        $('<p/>', {
            text: "Sorry, there were no matching results...",
            class: "results_header"
        }).appendTo($(obj));
    }
};


