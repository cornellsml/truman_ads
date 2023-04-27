function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.like.button').next("a.ui.basic.red.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").hasClass("adPost") ? "Ad" : "Normal";

    if (target.hasClass("red")) { //Unlike Post
        target.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });
        const unlike = Date.now();

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                unlike: unlike,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                unlike: unlike,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    } else { //Like Post
        target.addClass("red");
        label.html(function(i, val) { return val * 1 + 1 });
        const like = Date.now();

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                like: like,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                like: like,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    }
}

function flagPost(e) {
    const target = $(e.target);
    const post = target.closest(".ui.fluid.card.dim");
    const postID = post.attr("postID");
    const postClass = post.hasClass("adPost") ? "Ad" : "Normal";
    const flag = Date.now();

    $.post("/feed", {
        postID: postID,
        flag: flag,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
    post.find(".ui.dimmer.flag").dimmer({ closable: false }).dimmer('show');
    //repeat to ensure its closable
    post.find(".ui.dimmer.flag").dimmer({ closable: false }).dimmer('show');
}

function likeComment(e) {
    const target = $(e.target);
    const comment = target.parents(".comment");
    const label = comment.find("span.num");

    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").hasClass("adPost") ? "Ad" : "Normal";
    const commentID = comment.attr("commentID");
    const isUserComment = comment.find("a.author").attr('href') === '/me';

    if (target.hasClass("red")) { //Unlike comment
        target.removeClass("red");
        comment.find("i.heart.icon").removeClass("red");
        target.html('Like');
        label.html(function(i, val) { return val * 1 - 1 });
        const unlike = Date.now();

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost') {
            $.post("/userPost_feed", {
                postID: postID,
                commentID: commentID,
                unlike: unlike,
                isUserComment: isUserComment,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        } else {
            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                unlike: unlike,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    } else { //Like comment
        target.addClass("red");
        comment.find("i.heart.icon").addClass("red");
        target.html('Unlike');
        label.html(function(i, val) { return val * 1 + 1 });
        const like = Date.now();

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                commentID: commentID,
                like: like,
                isUserComment: isUserComment,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                like: like,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    }
}

function flagComment(e) {
    const target = $(e.target);
    const comment = target.parents(".comment");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").hasClass("adPost") ? "Ad" : "Normal";
    const commentID = comment.attr("commentID");
    comment.replaceWith(`
        <div class="comment" commentID="${commentID}" style="background-color:black;color:white">
            <h5 class="ui inverted header" style="padding-bottom: 0.5em; padding-left: 0.5em;">
                The admins will review this comment further. We are sorry you had this experience.
            </h5>
        </div>`);
    const flag = Date.now();

    if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
        console.log("Should never be here.")
    else
        $.post("/feed", {
            postID: postID,
            commentID: commentID,
            flag: flag,
            postClass: postClass,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
}

function addComment(e) {
    const target = $(e.target);
    const text = target.siblings(".ui.form").find("textarea.newcomment").val().trim();
    const card = target.parents(".ui.fluid.card");
    let comments = card.find(".ui.comments");
    const postClass = target.parents(".ui.fluid.card").hasClass("adPost") ? "Ad" : "Normal";
    //no comments area - add it
    if (!comments.length) {
        const buttons = card.find(".ui.bottom.attached.icon.buttons")
        buttons.after('<div class="content"><div class="ui comments"></div>');
        comments = card.find(".ui.comments")
    }
    if (text.trim() !== '') {
        const date = Date.now();
        const ava = target.siblings('.ui.label').find('img.ui.avatar.image');
        const ava_img = ava.attr("src");
        const ava_name = ava.attr("name");
        const postID = card.attr("postID");
        const commentID = numComments + 1;

        const mess = `
        <div class="comment" commentID=${commentID}>
            <a class="avatar"><img src="${ava_img}"></a>
            <div class="content"> 
                <a class="author" href="/me">${ava_name}</a>
                <div class="metadata"> 
                    <span class="date">${humanized_time_span(date)}</span>
                    <i class="heart icon"></i> 
                    <span class="num"> 0 </span> Likes
                </div> 
                <div class="text">${text}</div>
                <div class="actions"> 
                    <a class="like comment" onClick="likeComment(event)">Like</a> 
                </div> 
            </div>
        </div>`;
        $(this).siblings(".ui.form").find("textarea.newcomment").val('');
        comments.append(mess);

        if (card.attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                new_comment: date,
                comment_text: text,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            }).then(function(json) {
                numComments = json.numComments;
            });
        else
            $.post("/feed", {
                postID: postID,
                new_comment: date,
                comment_text: text,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            }).then(function(json) {
                numComments = json.numComments;
            });;
    }
}

function followUser(e) {
    const target = $(e.target);
    const username = target.attr('actor_un');
    if (target.text().trim() == "Follow") { //Follow Actor
        $(`.ui.basic.primary.follow.button[actor_un=${username}]`).each(function(i, element) {
            const button = $(element);
            button.text("Following");
            button.prepend("<i class='check icon'></i>");
        })
        $.post("/user", {
            followed: username,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        })
    } else { //Unfollow Actor
        $(`.ui.basic.primary.follow.button[actor_un=${username}]`).each(function(i, element) {
            const button = $(element);
            button.text("Follow");
            button.find('i').remove();
        })
        $.post("/user", {
            unfollowed: username,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        })
    }
}

function hideAd(e) {
    const target = $(e.target);
    target.hide();

    const ad = target.parent().next('.ui.fluid.card.dim');
    const postID = ad.attr("postID");
    const hide = Date.now();

    ad.hide();
    ad.replaceWith("<div class='ui fluid card dim' style='background-color:#F5F5F5; display:flex; align-items: center; justify-items: center; padding: 1em 0; margin-bottom: 2em;'> <i class='icon check circle outline green big'></i><p style='margin-top:5px'> This ad has been hidden. </p></div>").fadeIn("slow");

    $.post("/feed", {
        postID: postID,
        hide: hide,
        postClass: "Ad",
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

$(window).on('load', () => {
    // ************ Actions on Main Post ***************
    // Focus new comment element if "Reply" button is clicked
    $('.reply.button').on('click', function() {
        let parent = $(this).closest(".ui.fluid.card");
        parent.find("textarea.newcomment").focus();
    });

    // Press enter to submit a comment
    $("textarea.newcomment").keydown(function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $(this).parents(".ui.form").siblings("i.big.send.link.icon").click();

        }
    });

    //Create a new Comment
    $("i.big.send.link.icon").on('click', addComment);

    //Like/Unlike Post
    $('.like.button').on('click', likePost);

    //Flag Post
    $('.flag.button').on('click', flagPost);

    // ************ Actions on Comments***************
    // Like/Unlike comment
    $('a.like.comment').on('click', likeComment);

    //Flag comment
    $('a.flag.comment').on('click', flagComment);

    //Follow button
    $('.ui.basic.primary.follow.button').on('click', followUser);

    //Hide Ad
    $('h3.suggestedHeader i.close.icon').on('click', hideAd);
});