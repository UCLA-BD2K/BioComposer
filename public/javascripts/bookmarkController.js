var bookmarkController = Object.create(APIConnection);
api_connections["bookmark"] = bookmarkController;

bookmarkController.searchSequence = function (value) {
	console.log("searchSequence called")
    this.getBookmarks(value)
        .then(this.displayBookmarks);
};

bookmarkController.addBookmark = function(data) {
	$.ajax({
        type: "POST",
        url: "/add_bookmark",
        data: data,
        success: function(msg){
            alertMessage(msg);
        },
        dataType: "text"
    });
},

bookmarkController.removeBookmark = function(data) {
	$.ajax({
        type: "POST",
        url: "/remove_bookmark",
        data: data,
        success: function(msg){
            alertMessage(msg);
        },
        dataType: "text"
    });
}

bookmarkController.getBookmarks = function(search_term) {
	console.log("getBookmarks called")
	var data = {
		sort_type: "-date_saved",
		limit: itemsPerPage,
		offset: (pageNum-1)*itemsPerPage
	};
	return $.ajax({
				type: "POST",
				url: "/get_bookmarks",
				data: data,
				success: function(data){
					console.log(data);
		            bookmarkController.resetSearchHTML();
		            ajaxLock = 0
		        },
		        error: function() { 
		            console.log("failed");
		            bookmarkController.resetSearchHTML();
		            ajaxLock = 0;
		        }
			});	
}

bookmarkController.displayBookmarks = function(bookmarks) {
	//Results container
    var wrapper = $('.results_container')[0];
    var results = $('#search_results').html("");

    //Create page control buttons
    bookmarkController.initResultsNavigator(wrapper);

    if (bookmarks.length < itemsPerPage) {
        // If not results panel not filled, disable pageNext
        $('#pageNext').unbind('click');
        // If first page, disable pagePrev
        if (pageNum == 1)
            $('#pagePrev').unbind('click');
    }

    //Create each DIV for each uniprot 
    for (var i = 0; i < bookmarks.length; i++) {
        let bookmark = bookmarks[i];
        let alternate;
        if (i%2 == 0)
            alternate="single_result_a";
        else
            alternate="single_result_b";

        
        //Basically see if user is clicking for longer that 1500ms which would indicate that it is not a click, but a highlight
        var timeoutId; 
        highLightLock = false;
        var container = $('<div/>', {
            class: "single_result " + alternate,
            id: bookmark.bookmark_id,
            html: bookmark.html_content,
            click: function() {
            	console.log(bookmark.bookmark_id);
            	console.log(bookmark.api);
                clickSeeMore(this, bookmark.api);
            }
        }).appendTo(results);

        api_connections[bookmark.api].setContainerData(container, bookmark.ref_data);
        
        //MECHANISM HERE TO PREVENT HIGH LIGHT PROBLEM
        container.mousedown(function(){highLightLock = false; timeoutId = setTimeout(function(){highLightLock = true}, 1000)}).mouseup(function(){clearTimeout(timeoutId)});
        
        let data = {
            bookmark_id: bookmark.bookmark_id,
            api: bookmark.api,
            ref_data: bookmark.ref_data
        }

    
        generateBookmarkStar(data, $(container).children('.result_header'));

        /*
        var header = $('<div/>').click(function(){if (!highLightLock){Uniprot_API_Connection.seeMore($(this));}})
        .data("id", uniprot.accession).appendTo(container);

        //Add data to container
        $(container).data('type', 'Uniprot');
        $(container).data('id', uniprot.accession);
        $(container).data('url', encodeURIComponent(uniprot.url));
        $(container).data('title', 
            [uniprot.proteinName, uniprot.organism].join(' - '));
        $(container).data('website', uniprot.accession);
        $(container).data('publisher', 'Uniprot');
        /*
        $(container).data('date', encodeURIComponent(article.date));
        $(container).data('authors', encodeURIComponent(authors));
        $(container).data('publisher', encodeURIComponent(article.source));
    */
/*
        $('<a/>', {
            href: uniprot.url,
            target: "_blank",
            class: 'result_header'
        }).appendTo(header);
        
        //Add escaped html
        $($('.result_header')[i]).html((i+1+retstart) + ". " + unescapeHtml(uniprot.accession));
        
        $('<p/>', {
            text: uniprot.proteinName
        }).appendTo(header);
        
        $('<p/>', {
            text: uniprot.geneName
        }).appendTo(header);
        
        $('<button/>', {
            text: "Reference",
            class: 'button refButton',
            click: function(e){
                e.stopPropagation();
                generateCitation($(this).parent())
            }
            }).appendTo(container);
        */
      }
      $('.refButton').click(function(e){
                clickReference(e, this);
            });
      $(".star").prop('checked', true);
 
}

// Override page navigation
bookmarkController.initResultsNavigator = function(wrapper) {
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
            text: "Bookmarked References " + "..."
          }).addClass('query_header').prependTo(wrapper);
}

// Use "this" movePage and not the helper function for Uniprot API
bookmarkController.movePage = function(x) {
    if (pageNum == 1 && x < 0)
        return;
    pageNum += x;
    retstart += x*itemsPerPage; 
    this.startSearch(false); 
}

