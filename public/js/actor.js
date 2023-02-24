$(window).on("load", function() {
    $('.coupled.modal').modal({
        allowMultiple: false
    });

    //REPORT Actor Modal #1
    $('.ui.small.report.modal')
        .modal({
            onHidden: function(e) {
                console.log(e)
                $(".ui.small.report.modal input[type=radio]").each(function() {
                    $(this).prop('checked', false);
                });
                $(".ui.small.report.modal input.ui.green.button").addClass('disabled');
                if (blocked) {
                    //Modal for Blocked Users
                    $('.ui.small.basic.blocked.modal').modal('show');
                }
            },
            onVisible: function() {
                $('input:radio[name="report_issue"]').change(function() {
                    $('input.ui.green.button.disabled').removeClass('disabled');
                })
            }
        });

    //REPORT Actor Modal #2
    $('.second.modal').modal({
        closable: false,
        onShow: function() {
            //Modal for Blocked Users
            $('.second.modal').modal('hide others');
        },
        onHidden: function(modal) {
            if (blocked) {
                //Modal for Blocked Users
                $('.ui.small.basic.blocked.modal').modal('show').removeClass('hidden');
            }
        }
    });

    //BLOCK Actor Modal
    $('.ui.small.basic.blocked.modal')
        .modal({
            allowMultiple: false,
            closable: false,
            onDeny: function() {
                //report user
            },
            onApprove: function() {
                //unblock user
                var username = $('button.ui.button.block').attr("username");
                $.post("/user", { unblocked: username, _csrf: $('meta[name="csrf-token"]').attr('content') })
                    .then(function() {
                        blocked = false;
                    });
            }
        });

    // attach events to buttons: open second modal with first modal buttons
    $('.second.modal').modal('attach events', '.report.modal .button', 'show');

    // attach events to buttons: open report modal with blocked modal button
    $('.report.modal').modal('attach events', '.blocked.modal .red.button', 'show');

    //REPORT Actor button
    $('.ui.button.report').on('click', function() {
        // show first modal
        $('.ui.small.report.modal').modal('show');
    });

    //REPORT Actor Form
    $('form#reportform').submit(function(e) {
        e.preventDefault();
        reported = true;
        $.post($(this).attr('action'), $(this).serialize(), function(res) {
            $('.ui.small.basic.blocked.modal').modal('hide');
            console.log("POST completed")
        });
    });

    //BLOCK Actor button
    $('button.ui.button.block').on('click', function() {
        var username = $(this).attr("username");
        blocked = true;
        $.post("/user", { blocked: username, _csrf: $('meta[name="csrf-token"]').attr('content') });

        //Modal for Blocked Users
        $('.ui.small.basic.blocked.modal').modal('show');
    });

    //Actor is already blocked
    if (blocked) {
        //Modal for Blocked Users
        $('.ui.small.basic.blocked.modal').modal('show');
    }
});