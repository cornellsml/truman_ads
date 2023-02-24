//Before Page load:
$('#content').hide();
$('#loading').show();

$(window).on("load", function() {
    //close loading dimmer on load
    $('#loading').hide();
    $('#content').attr('style', 'block');
    $('#content').fadeIn('slow');

    //Semantic UI: closes messages from flash message
    $('.message .close').on('click', function() {
        $(this).closest('.message').transition('fade');
    });
    //Semantic UI: make checkbox work
    $('.ui.checkbox').checkbox();

    //check bell display (and make red if there are notifications)
    if (!(top.location.pathname === '/login' || top.location.pathname === '/signup')) {
        $.getJSON("/bell", function(json) {
            if (json.result) {
                $("i.big.alarm.icon").replaceWith('<i class="big icons"><i class="red alarm icon"></i><i class="corner yellow lightning icon"></i></i>');
            }
        });
    }

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

    //add humanized time to all posts
    $('.right.floated.time.meta, .date').each(function() {
        var ms = parseInt($(this).text(), 10);
        let time = new Date(ms);
        $(this).text(humanized_time_span(time));
    });

    //Button to go to feed
    $('.ui.big.green.labeled.icon.button.feed, .ui.home.inverted.button').on('click', function() {
        window.location.href = '/';
    });

    //Edit button
    $('.ui.editprofile.button').on('click', function() {
        window.location.href = '/account';
    });

    //////TESTING
    $('.ui.fluid.card .img.post').visibility({
        once: false,
        continuous: false,
        observeChanges: true,
        //throttle:100,
        initialCheck: true,

        //handling scrolling down like normal
        onBottomVisible: function(calculations) {
            var startTime = Date.now();
            $(this).siblings(".content").children(".myTimer").text(startTime);
            if (calculations.topVisible) { //then we are scrolling DOWN normally and this is the START time
                $(this).siblings(".content").children(".myTimer").text(startTime);
            } else { //then we are scrolling UP and this event does not matter!
            }
        },

        onTopPassed: function(calculations) {
            var endTime = Date.now();
            var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
            var totalViewTime = endTime - startTime; //TOTAL TIME HERE
            //POST HERE
            var parent = $(this).parents(".ui.fluid.card");
            var postID = parent.attr("postID");
            //console.log(postID);
            //Don't record it if it's longer than 24 hours, do this check because refresh causes all posts to be marked as "viewed" for 49 years.(???)
            if (totalViewTime < 86400000) {
                $.post("/feed", {
                    postID: postID,
                    viewed: totalViewTime,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
            }
            //console.log("Total time: " + totalViewTime);
            //console.log($(this).siblings(".content").children(".description").text());
        },
        //end handling downward scrolling

        //handling scrolling back upwards
        onTopPassedReverse: function(calculations) {
            var startTime = Date.now();
            $(this).siblings(".content").children(".myTimer").text(startTime);
        },

        onBottomVisibleReverse: function(calculations) {
            if (calculations.bottomPassed) {

            } else {
                //eND TIME FOR SCROLLING UP
                var endTime = Date.now();
                var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
                var totalViewTime = endTime - startTime; //TOTAL TIME HERE
                //POST HERE
                var parent = $(this).parents(".ui.fluid.card");
                var postID = parent.attr("postID");
                //console.log("PostID: " + postID);
                //console.log(postID);
                //Don't record it if it's longer than 24 hours, do this check because refresh causes all posts to be marked as "viewed" for 49 years. (???)
                if (totalViewTime < 86400000) {
                    $.post("/feed", {
                        postID: postID,
                        viewed: totalViewTime,
                        _csrf: $('meta[name="csrf-token"]').attr('content')
                    });
                }
                //console.log("Total time: " + totalViewTime);
                //console.log($(this).siblings(".content").children(".description").text());
            }
            //end handling scrolling back updwards
        }
    });
});