//$(document).ready(function() {

//Before Page load:
$('#content').hide();
$('#loading').show();

$(window).on("load", function() {

  //close loading dimmer on load
  $('#loading').hide();
  $('#content').attr('style', 'block');
  $('#content').fadeIn('slow');
  //close messages from flash message
  $('.message .close')
  .on('click', function() {
    $(this)
      .closest('.message')
      .transition('fade')
    ;
  });

  //check bell
  if (!(top.location.pathname === '/login' || top.location.pathname === '/signup'))
  {

    $.getJSON( "/bell", function( json ) {

      if (json.result)
      {
        $("i.big.alarm.icon").replaceWith( '<i class="big icons"><i class="red alarm icon"></i><i class="corner yellow lightning icon"></i></i>' );
      }

   });
}

  //make checkbox work
  $('.ui.checkbox')
  .checkbox();


  $(' .ui.tiny.post.modal').modal({
      observeChanges  : true
    })
  ;

  //get add new feed post modal to work
  $("#newpost, a.item.newpost").click(function () {
    $(' .ui.tiny.post.modal').modal('show');
});

  //new post validator (picture and text can not be empty)
  $('.ui.feed.form')
  .form({
    on: 'blur',
    fields: {
      body: {
        identifier  : 'body',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please add some text about your meal'
          }
        ]
      },
      picinput: {
        identifier  : 'picinput',
        rules: [
          {
            type: 'notExactly[/public/photo-camera.svg]',
            prompt : 'Please click on Camera Icon to add a photo'
          }
        ]
      }
    },

    onSuccess:function(event, fields){
      //console.log("Event is :");
      //console.log(event);
      //console.log("fields is :");
      //console.log(fields);
      $(".ui.feed.form")[0].submit();
    }

  });

  $('.ui.feed.form').submit(function(e) {
        e.preventDefault();
        //console.log("Submit the junks!!!!")
        //$('.ui.tiny.nudge.modal').modal('show');
        //return true;
        });


//Picture Preview on Image Selection
function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            //console.log("Now changing a photo");
            reader.onload = function (e) {
                $('#imgInp').attr('src', e.target.result);
                //console.log("FILE is "+ e.target.result);
            }

            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#picinput").change(function(){
        //console.log("@@@@@ changing a photo");
        readURL(this);
    });

//Modal to show "other users" in Notifications
/*
$('a.others').click(function(){
  let key = $(this).attr('key');


  $('.ui.long.extrausers.modal#'+key).modal({
    onVisible: function() {
      var el = document.querySelector('.ui.long.extrausers.modal#'+key+" div.ui.extra.divided.items");
      var lazyLoad = new LazyLoad({
         container: el /// <--- not sure if this works here, read below
    });



    }
  }).modal('show')
}); */

//add humanized time to all posts
$('.right.floated.time.meta, .date').each(function() {
    var ms = parseInt($(this).text(), 10);
    let time = new Date(ms);
    $(this).text(humanized_time_span(time));
});

  //Sign Up Button
  $('.ui.big.green.labeled.icon.button.signup')
  .on('click', function() {
    window.location.href='/signup';
  });

  //Sign Up Info Skip Button
  $('button.ui.button.skip')
  .on('click', function() {
    window.location.href='/com';
  });

  //Community Rules Button (rocket!!!)
  $('.ui.big.green.labeled.icon.button.com')
  .on('click', function() {
    window.location.href='/info'; //maybe go to tour site???
  });

  //Community Rules Button (rocket!!!)
  $('.ui.big.green.labeled.icon.button.info')
  .on('click', function() {
    window.location.href='/'; //maybe go to tour site???
  });

  //Profile explaination Page
  $('.ui.big.green.labeled.icon.button.profile')
  .on('click', function() {
    window.location.href='/profile_info'; //maybe go to tour site???
  });

  //More info Skip Button
  $('button.ui.button.skip')
  .on('click', function() {
    window.location.href='/com'; //maybe go to tour site???
  });

  //Edit button
  $('.ui.editprofile.button')
  .on('click', function() {
    window.location.href='/account';
  });


////////////////////
$("input.newcomment").keyup(function(event) {
    //i.big.send.link.icon
    //$(this).siblings( "i.big.send.link.icon")
    if (event.keyCode === 13) {
        $(this).siblings( "i.big.send.link.icon").click();
    }
});

//create a new Comment
$("i.big.send.link.icon").click(function() {
  var text = $(this).siblings( "input.newcomment").val();
  var card = $(this).parents( ".ui.fluid.card" );
  var comments = card.find( ".ui.comments" )
  //no comments area - add it
  //console.log("Comments is now "+comments.length)
  if( !comments.length )
  {
    //.three.ui.bottom.attached.icon.buttons
    //console.log("Adding new Comments sections")
    var buttons = card.find( ".three.ui.bottom.attached.icon.buttons" )
    buttons.after( '<div class="content"><div class="ui comments"></div>' );
    var comments = card.find( ".ui.comments" )
  }
  if (text.trim() !== '')
  {
    //console.log(text)
    var date = Date.now();
    var ava = $(this).siblings('.ui.label').find('img.ui.avatar.image');
    var ava_img = ava.attr( "src" );
    var ava_name = ava.attr( "name" );
    var postID = card.attr( "postID" );

    var mess = '<div class="comment"> <a class="avatar"> <img src="'+ava_img+'"> </a> <div class="content"> <a class="author">'+ava_name+'</a> <div class="metadata"> <span class="date">'+humanized_time_span(date)+'</span> <i class="heart icon"></i> 0 Likes </div> <div class="text">'+text+'</div> <div class="actions"> <a class="like">Like</a> <a class="flag">Flag</a> </div> </div> </div>';
    $(this).siblings( "input.newcomment").val('');
    comments.append(mess);
    //console.log("######### NEW COMMENTS:  PostID: "+postID+", new_comment time is "+date+" and text is "+text);

    if (card.attr( "type" )=='userPost')
      $.post( "/userPost_feed", { postID: postID, new_comment: date, comment_text: text, _csrf : $('meta[name="csrf-token"]').attr('content') } );
    else
      $.post( "/feed", { postID: postID, new_comment: date, comment_text: text, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  }
});
  ///////////////////


  //this is the REPORT User button
  $('button.ui.button.report')
  .on('click', function() {

    var username = $(this).attr( "username" );

    $('.ui.small.report.modal').modal('show');

    $('.coupled.modal')
      .modal({
        allowMultiple: false
      })
    ;
    // attach events to buttons
    $('.second.modal')
      .modal('attach events', '.report.modal .button')
    ;
    // show first now
    $('.ui.small.report.modal')
      .modal('show')
    ;

  });

  //Report User Form//
  $('form#reportform').submit(function(e){

    e.preventDefault();
    $.post($(this).attr('action'), $(this).serialize(), function(res){
        // Do something with the response `res`
        //console.log(res);
        // Don't forget to hide the loading indicator!
    });
    //return false; // prevent default action

});

  $('.ui.home.inverted.button')
    .on('click', function() {
      window.location.href='/';
    });

  //this is the Block User button
  $('button.ui.button.block')
  .on('click', function() {

    var username = $(this).attr( "username" );
    //Modal for Blocked Users
    $('.ui.small.basic.blocked.modal')
      .modal({
        closable  : false,
        onDeny    : function(){
          //report user

        },
        onApprove : function() {
          //unblock user
          $.post( "/user", { unblocked: username, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }
      })
      .modal('show')
    ;


    //console.log("***********Block USER "+username);
    $.post( "/user", { blocked: username, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //Block Modal for User that is already Blocked
  $('.ui.on.small.basic.blocked.modal')
  .modal({
    closable  : false,
    onDeny    : function(){
      //report user

    },
    onApprove : function() {
      //unblock user
      var username = $('button.ui.button.block').attr( "username" );
      $.post( "/user", { unblocked: username, _csrf : $('meta[name="csrf-token"]').attr('content') } );

    }
  })
  .modal('show')
;

  //this is the LIKE button
  $('.like.button')
  .on('click', function() {

    //if already liked, unlike if pressed
    if ( $( this ).hasClass( "red" ) ) {
        //console.log("***********UNLIKE: post");
        $( this ).removeClass("red");
        var label = $(this).next("a.ui.basic.red.left.pointing.label.count");
        label.html(function(i, val) { return val*1-1 });
        var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
        var unlike = Date.now();
        //console.log("***********UNLIKE: post "+postID+" at time "+unlike);
        if ($(this).closest( ".ui.fluid.card" ).attr( "type" )=='userPost')
          $.post( "/userPost_feed", { postID: postID, unlike: unlike, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        else
          $.post( "/feed", { postID: postID, unlike: unlike, _csrf : $('meta[name="csrf-token"]').attr('content') } );
    }
    //since not red, this button press is a LIKE action
    else{
      $(this).addClass("red");
      var label = $(this).next("a.ui.basic.red.left.pointing.label.count");
      label.html(function(i, val) { return val*1+1 });
      var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
      var like = Date.now();
      //console.log("***********LIKE: post "+postID+" at time "+like);

      if ($(this).closest( ".ui.fluid.card" ).attr( "type" )=='userPost')
        $.post( "/userPost_feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );
      else
        $.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

    }

  });

  //a.like.comment
  $('a.like.comment')
  .on('click', function() {

    //if already liked, unlike if pressed
    if ( $( this ).hasClass( "red" ) ) {
        //console.log("***********UNLIKE: post");
        //Un read Like Button
        $( this ).removeClass("red");

        var comment = $(this).parents( ".comment" );
        comment.find( "i.heart.icon" ).removeClass("red");

        var label = comment.find( "span.num" );
        label.html(function(i, val) { return val*1-1 });

        var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
        var commentID = comment.attr("commentID");
        var unlike = Date.now();

        if ($(this).closest( ".ui.fluid.card" ).attr( "type" )=='userPost'){
          //$.post( "/userPost_feed", { postID: postID, commentID: commentID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        } else {
          $.post( "/feed", { postID: postID, commentID: commentID, unlike: unlike, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }
    }
    //since not red, this button press is a LIKE action
    else{
      $(this).addClass("red");
      var comment = $(this).parents( ".comment" );
      comment.find( "i.heart.icon" ).addClass("red");

      var label = comment.find( "span.num" );
      label.html(function(i, val) { return val*1+1 });

      var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
      var commentID = comment.attr("commentID");
      var like = Date.now();
      //console.log("#########COMMENT LIKE:  PostID: "+postID+", Comment ID: "+commentID+" at time "+like);

      if ($(this).closest( ".ui.fluid.card" ).attr( "type" )=='userPost')
        $.post( "/userPost_feed", { postID: postID, commentID: commentID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );
      else
        $.post( "/feed", { postID: postID, commentID: commentID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

    }

  });

   //this is the FLAG button
   //flag a comment
  $('a.flag.comment')
  .on('click', function() {

    var comment = $(this).parents( ".comment" );
    var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
    var typeID = $(this).closest( ".ui.fluid.card" ).attr( "type" );
    var commentID = comment.attr("commentID");
    comment.replaceWith( '<div class="comment" commentID='+commentID+' style="background-color:black;color:white"><h5 class="ui inverted header"><span>The admins will review this post further. We are sorry you had this experience.</span></h5></div>' );
    var flag = Date.now();
    //console.log("#########COMMENT FLAG:  PostID: "+postID+", Comment ID: "+commentID+"  TYPE is "+typeID+" at time "+flag);

    if (typeID=='userPost')
      $.post( "/userPost_feed", { postID: postID, commentID: commentID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );
    else
      $.post( "/feed", { postID: postID, commentID: commentID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //this is the "yes" button when responding to the content moderation question
 $('.agree')
 .on('click', function() {

   var comment = $(this).parents( ".ui.info.message").children('.comment');
   var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
   var typeID = $(this).closest( ".ui.fluid.card" ).attr( "type" );
   var commentID = comment.attr("commentID");
   var nextQuestion = $(this).parents('.ui.info.message').siblings('.comment.modRespondedYes');
   var currentQuestion =  $(this).parents('.ui.info.message');
   var clickedYes = Date.now();
   $(this).closest( ".ui.fluid.card" ).css({'background-color':''});
   $(this).closest('.info.message').css({'box-shadow':''});
   $(this).parent('.content').siblings('.ui.inverted.dimmer').removeClass('disabled').addClass('active');

   $.post( "/feed", { postID: postID, commentID: commentID, clickedYes: clickedYes, _csrf : $('meta[name="csrf-token"]').attr('content') }, function(){
     currentQuestion.hide();
     nextQuestion.show();
   } );
 });

 //this is the "no" button when responding to the content moderation question
  $('.disagree')
  .on('click', function() {
    var comment = $(this).parents( ".ui.info.message").children('.comment');
    var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
    var typeID = $(this).closest( ".ui.fluid.card" ).attr( "type" );
    var commentID = comment.attr("commentID");
    var currentQuestion = $(this).parents('.ui.info.message');
    var nextQuestion = $(this).parents('.ui.info.message').siblings('.comment.modRespondedNo');
    var clickedNo = Date.now();
    $(this).closest( ".ui.fluid.card" ).css({'background-color':''});
    $(this).closest('.info.message').css({'box-shadow':''});
    $(this).parent('.content').siblings('.ui.inverted.dimmer').removeClass('disabled').addClass('active');

    $.post( "/feed", { postID: postID, commentID: commentID, clickedNo: clickedNo, _csrf : $('meta[name="csrf-token"]').attr('content') }, function(){
      currentQuestion.hide();
      nextQuestion.show();
    } );

  });

  //this is the "view policy" button after responding to the content moderation question
   $('.modInfo')
   .on('click', function() {
     var comment = $(this).parents( ".comment" );
     var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
     var typeID = $(this).closest( ".ui.fluid.card" ).attr( "type" );
     var commentID = comment.attr("commentID");
     var clickedViewPolicy = Date.now();
     //$(this).hide();
     $(this).parent('.content').siblings('.ui.inverted.dimmer').removeClass('disabled').addClass('active');
     //$(this).siblings(".noModInfo").hide();
     //console.log("#########COMMENT FLAG:  PostID: "+postID+", Comment ID: "+commentID+"  TYPE is "+typeID+" at time "+clickedViewPolicy);

     $.post( "/feed", { postID: postID, commentID: commentID, clickedViewPolicy: clickedViewPolicy, _csrf : $('meta[name="csrf-token"]').attr('content') }, function(){
       window.location.href='/policy';
     } );

   });

 //this is the "no, don't view policy" button after responding to the content moderation question
  $('.noModInfo')
  .on('click', function() {
    var comment = $(this).parents( ".comment" );
    var postID = $(this).closest( ".ui.fluid.card" ).attr( "postID" );
    var typeID = $(this).closest( ".ui.fluid.card" ).attr( "type" );
    var commentID = comment.attr("commentID");
    var changeHeader = $(this).siblings(".header");
    var loaderDimmer = $(this).parent('.content').siblings('.ui.inverted.dimmer');
    var clickedNoViewPolicy = Date.now();
    $(this).hide();
    $(this).siblings(".modInfo").hide();
    $(this).parent('.content').siblings('.ui.inverted.dimmer').removeClass('disabled').addClass('active');
    //console.log("#########COMMENT FLAG:  PostID: "+postID+", Comment ID: "+commentID+"  TYPE is "+typeID+" at time "+clickedNoViewPolicy);
    $.post( "/feed", { postID: postID, commentID: commentID, clickedNoViewPolicy: clickedNoViewPolicy, _csrf : $('meta[name="csrf-token"]').attr('content') }, function(){
      changeHeader.text("Thank you! Your response has been recorded.");
      loaderDimmer.removeClass('active').addClass('disabled');
    } );
  });

  //this is to track if a user clicked to view the policy from the dropdown menu
  $(".viewPolicyDropdown")
  .on('click', function(){
    var viewPolicyDropdownTime = Date.now();
    $.post( "/view_policy", { viewPolicyDropdownTime: viewPolicyDropdownTime, _csrf : $('meta[name="csrf-token"]').attr('content') }, function(){
      window.location.href='/policy';
    } );
  })

  //this is the POST FLAG button
  //flag a post
  $('.flag.button')
  .on('click', function() {

     var post = $(this).closest( ".ui.fluid.card.dim");
     var postID = post.attr( "postID" );
     var flag = Date.now();
     //console.log("***********FLAG: post "+postID+" at time "+flag);
     $.post( "/feed", { postID: postID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );
     //console.log("Removing Post content now!");
     post.find(".ui.dimmer.flag").dimmer({
                   closable: false
                  })
                  .dimmer('show');
      //repeat to ensure its closable
      post.find(".ui.dimmer.flag").dimmer({
                   closable: false
                  })
                  .dimmer('show');


  });

  //this is the POST REPLY button
  $('.reply.button')
  .on('click', function () {

    let parent = $(this).closest(".ui.fluid.card");
    let postID = parent.attr("postID");

    parent.find("input.newcomment").focus();

  });

  //User wants to REREAD
  $('.ui.button.reread')
  .on('click', function() {
    //.ui.active.dimmer
    $(this).closest( ".ui.dimmer" ).removeClass( "active" );
    $(this).closest( ".ui.fluid.card.dim" ).find(".ui.inverted.read.dimmer").dimmer('hide');


     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var reread = Date.now();
     //console.log("##########REREAD######SEND TO DB######: post "+postID+" at time "+reread);
     $.post( "/feed", { postID: postID, start: reread, _csrf : $('meta[name="csrf-token"]').attr('content') } );
     //maybe send this later, when we have a re-read event to time???
     //$.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

//adding animations to the moderation comment
$('.ui.info.message')
.visibility({
  once       : false,
  continuous : false,
  observeChanges: true,
  //throttle:100,
  initialCheck : true,

  onBottomVisible:function(calculations){
    if($(this).is(':visible')){
      $(this).transition('pulse');
    }
  }
});

//////TESTING
$('.ui.fluid.card .img.post')
.visibility({
  once       : false,
  continuous : false,
  observeChanges: true,
  //throttle:100,
  initialCheck : true,

//handling scrolling down like normal
  onBottomVisible:function(calculations){
    var startTime = Date.now();
    $(this).siblings(".content").children(".myTimer").text(startTime);
    if(calculations.topVisible){ //then we are scrolling DOWN normally and this is the START time
      $(this).siblings(".content").children(".myTimer").text(startTime);
    } else { //then we are scrolling UP and this event does not matter!
    }
  },

  onTopPassed:function(calculations){
    var endTime = Date.now();
    var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
    var totalViewTime = endTime - startTime; //TOTAL TIME HERE
    //POST HERE
    var parent = $(this).parents(".ui.fluid.card");
    var postID = parent.attr( "postID" );
    //console.log(postID);
    //Don't record it if it's longer than 24 hours, do this check because refresh causes all posts to be marked as "viewed" for 49 years.(???)
    if(totalViewTime < 86400000){
      $.post( "/feed", { postID: postID, viewed: totalViewTime, _csrf : $('meta[name="csrf-token"]').attr('content') } );
    }
    //console.log("Total time: " + totalViewTime);
    //console.log($(this).siblings(".content").children(".description").text());
  },
//end handling downward scrolling

//handling scrolling back upwards
  onTopPassedReverse:function(calculations){
    var startTime = Date.now();
    $(this).siblings(".content").children(".myTimer").text(startTime);
  },

  onBottomVisibleReverse:function(calculations){
    if(calculations.bottomPassed){

    } else {
      //eND TIME FOR SCROLLING UP
      var endTime = Date.now();
      var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
      var totalViewTime = endTime - startTime; //TOTAL TIME HERE
      //POST HERE
      var parent = $(this).parents(".ui.fluid.card");
      var postID = parent.attr( "postID" );
      //console.log("PostID: " + postID);
      //console.log(postID);
      //Don't record it if it's longer than 24 hours, do this check because refresh causes all posts to be marked as "viewed" for 49 years. (???)
      if(totalViewTime < 86400000){
        $.post( "/feed", { postID: postID, viewed: totalViewTime, _csrf : $('meta[name="csrf-token"]').attr('content') } );
      }
      //console.log("Total time: " + totalViewTime);
      //console.log($(this).siblings(".content").children(".description").text());
    }
//end handling scrolling back updwards

  }

});

});
