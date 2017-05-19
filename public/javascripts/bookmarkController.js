var bookmarkController = Object.create(APIConnection);
api_connections["bookmark"] = bookmarkController;

bookmarkController.bookmarks = [];

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
		            ajaxLock = 0;
		            bookmarkController.bookmarks = data;
		            search_count = data.length;
		        },
		        error: function() { 
		            console.log("failed");
		            bookmarkController.resetSearchHTML();
		            ajaxLock = 0;
		        }
			});	
}

bookmarkController.displayBookmarks = function() {
	//Results container
    var wrapper = $('.results_container')[0];
    var results = $('#search_results').html("");

    //Create page control buttons
    bookmarkController.initResultsNavigator(wrapper);


    //Create each DIV for each uniprot 
    for (var i = 0; i < itemsPerPage; i++) {
    	let index = i+itemsPerPage*(pageNum-1);
    	if (index >= bookmarkController.bookmarks.length)
    		break;
        let bookmark = bookmarkController.bookmarks[index];
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
        }).attr("id", "pageNext").click(function(){bookmarkController.movePage(1);}).prependTo(wrapper);
        
        $('<p/>', {
            text: "PREVIOUS"
        }).attr("id", "pagePrev").click(function(){bookmarkController.movePage(-1);}).prependTo(wrapper);
        
         $('<p/>', {
            text: "Page " + pageNum + " of " + numberWithCommas(Math.ceil(search_count/itemsPerPage))
        }).attr("id", "pageNum").prependTo(wrapper);
        
        $('<h1/>',{
            text: search_count + " Bookmarked References" 
          }).addClass('query_header').prependTo(wrapper);
}

// Use "this" movePage and not the helper function
bookmarkController.movePage = function(x) {
    //Do nothing if out of bounds
    if ((x==-1 && pageNum==1) || (x==1 && pageNum == Math.ceil(search_count/itemsPerPage)))
        return;
    pageNum += x;
    this.startSearch(false); 
}


