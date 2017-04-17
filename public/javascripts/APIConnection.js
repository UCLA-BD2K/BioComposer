var APIConnection = {

    search_options: {},
    fetch_options: {},
    
    simpleAndSearch: function(newSearch) {
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
        }).addClass("loader").appendTo($("#search_wrap")); 
            
        $("#search_type").hide();
        
        this.searchSequence(ret)
        //    .then(this.fetchResults)
        //    .then(this.parseResults)
        //    .then(this.displayResults);
        }
    },

    searchSequence: function(value) {
        
    }
};


