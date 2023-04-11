//Before Page load:
$('#content').hide();
$('#loading').show();

$(window).on("load", function() {
    //add humanized time to all posts
    $('.right.floated.time.meta, .date').each(function() {
        var ms = parseInt($(this).text(), 10);
        let time = new Date(ms);
        $(this).text(humanized_time_span(time));
    });

    //close loading dimmer on load
    $('#loading').hide();
    $('#content').attr('style', 'block');
    $('#content').fadeIn('slow');

    //Semantic UI: function for closing messages
    $('.message .close').on('click', function() {
        $(this).closest('.message').transition('fade');
    });
    //Semantic UI: function to make checkbox work
    $('.ui.checkbox').checkbox();

    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        $.post("/pageLog", {
            path: window.location.pathname,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
        if (window.location.pathname !== '/notifications') {
            setInterval(function() {
                // method to be executed;
                $.getJSON("/notifications", { bell: true }, function(json) {
                    if (json.count != 0) {
                        $("i.big.alarm.icon").replaceWith('<i class="big icons"><i class="red alarm icon"></i><i class="corner yellow lightning icon"></i></i>');
                    }
                });
            }, 5000);
        }
    };

    //Picture Preview on Image Selection (Used for: uploading new post, updating profile)
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#imgInp').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#picinput").change(function() {
        readURL(this);
    });

    //Button to go to feed
    $('.ui.big.green.labeled.icon.button.feed, .ui.home.inverted.button').on('click', function() {
        window.location.href = '/';
    });

    //Edit button
    $('.ui.editprofile.button').on('click', function() {
        window.location.href = '/account';
    });

    // Track how long a post is on the screen (borders are defined by image)
    $('.ui.fluid.card .img.post').visibility({
        once: false,
        continuous: false,
        observeChanges: true,
        //throttle:100,
        initialCheck: true,
        offset: 50,

        //Handling scrolling down like normal
        //Called when bottomVisible turns true (bottom of a picture is visible): bottom can enter from top or bottom of viewport
        onBottomVisible: function(element) {
            // Bottom of picture enters from bottom (scrolling down the feed; as normal)
            if (element.topVisible) { // Scrolling Down AND entire post is visible on the viewport 
                var startTime = Date.now();
                $(this).siblings(".content").children(".myTimer").text(startTime);
            } else { //Scrolling up and this event does not matter, since entire photo isn't visible anyways.
            }
        },

        //Element's top edge has passed top of the screen (disappearing); happens only when Scrolling Down
        onTopPassed: function(element) {
            // If user viewed it for less than 24 hours, but more than 1.5 seconds (just in case)
            if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
                var endTime = Date.now();
                var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
                var totalViewTime = endTime - startTime; //TOTAL TIME HERE

                var parent = $(this).parents(".ui.fluid.card");
                var postID = parent.attr("postID");
                $.post("/feed", {
                    postID: postID,
                    viewed: totalViewTime,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
            }
        },

        //Handling scrolling up
        //Element's top edge has passed top of the screen (appearing); happens only when Scrolling Up
        onTopPassedReverse: function(element) {
            if (element.bottomVisible) { // Scrolling Up AND entire post is visible on the viewport 
                var startTime = Date.now();
                $(this).siblings(".content").children(".myTimer").text(startTime);
            }
        },

        // Called when bottomVisible turns false (exits from top or bottom)
        onBottomVisibleReverse: function(element) {
            if (element.bottomPassed) { //Scrolling Down, disappears on top; this event doesn't matter (since it should have already been logged)
            } else { // False when Scrolling Up (the bottom of photo exits screen.)
                var endTime = Date.now();
                var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
                var totalViewTime = endTime - startTime;

                var parent = $(this).parents(".ui.fluid.card");
                var postID = parent.attr("postID");
                // If user viewed it for less than 24 hours, but more than 1.5 seconds (just in case)
                if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
                    $.post("/feed", {
                        postID: postID,
                        viewed: totalViewTime,
                        _csrf: $('meta[name="csrf-token"]').attr('content')
                    })
                }
            }
        }
    });
});