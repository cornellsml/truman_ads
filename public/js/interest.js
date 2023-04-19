let pickOrder = [];

function canContinue() {
    const chosePicture = $('.image.green').length == 2;
    if (chosePicture) {
        $(".ui.big.labeled.icon.button").addClass("green");
        $(".ui.big.labeled.icon.button")[0].scrollIntoView({ behavior: "smooth" });
    } else {
        $(".ui.big.labeled.icon.button").removeClass("green");
    }
}

$(window).on("load", async function() {
    $('.ui.big.labeled.icon.button').removeClass('loading disabled');
    // Click a photo
    $('.image').on('click', function() {
        mostRecentPick = $(this).attr('id');
        // Unselecting
        if ($(this).hasClass("green")) {
            console.log("hasGreen")
            $(this).removeClass("green");
            $(this).find(`i.icon.green.check`).addClass("hidden");
            const index = pickOrder.indexOf(mostRecentPick);
            if (index > -1) { // only splice array when item is found
                pickOrder.splice(index, 1); // 2nd parameter means remove one item only
            }
        } else { // Selecting
            pickOrder.push(mostRecentPick);

            if ($('.image.green').length >= 2) {
                var firstElement = pickOrder.shift();
                // clear any photos selected 
                $(`.image#${firstElement}`).removeClass("green");
                $(`.image#${firstElement} i.icon.green.check`).addClass("hidden");
            }

            $(this).closest('.image').addClass("green");
            $(this).find('i.icon').removeClass("hidden");
        }

        canContinue();

        if ($('.ui.warning.message').is(":visible")) {
            $('.ui.warning.message').hide();
        }
    })

    $(".ui.big.labeled.icon.button").on('click', function() {
        const chosePicture = $('.image.green').length == 2;
        if (chosePicture) {
            const foodStyles = pickOrder;
            $(this).addClass('loading disabled');
            $.post('/account/interest', {
                    interests: foodStyles,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                })
                .done(function(json) {
                    if (json["result"] === "success") {
                        window.location.href = '/'
                    }
                });
        } else {
            $('.ui.warning.message').removeClass("hidden");
            $('.ui.warning.message')[0].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });
});