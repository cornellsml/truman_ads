const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = require('passport');
const moment = require('moment');
const User = require('../models/User');
const Notification = require('../models/Notification.js');
const Script = require('../models/Script.js');

// From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/login', {
        title: 'Login'
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
    req.assert('email', 'Email is not valid.').isEmail();
    req.assert('password', 'Password cannot be blank.').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        console.log(errors);
        return res.redirect('/login');
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('errors', info);
            return res.redirect('/login');
        }
        if (!(user.active)) {
            var post_url = user.endSurveyLink;
            req.flash('final', { msg: post_url });
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }

            var temp = req.session.passport; // {user: 1}
            var returnTo = req.session.returnTo;
            req.session.regenerate(function(err) {
                //req.session.passport is now undefined
                req.session.passport = temp;
                req.session.save(function(err) {
                    const time_now = Date.now();
                    const userAgent = req.headers['user-agent'];
                    const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    user.logUser(time_now, userAgent, user_ip);
                    if (user.consent) {
                        return res.redirect(returnTo || '/');
                    } else {
                        return res.redirect(returnTo || '/account/signup_info');
                    }
                });
            });
        });
    })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
    req.logout();
    res.redirect('/login');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/signup', {
        title: 'Create Account'
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
    req.assert('email', 'Email is not valid.').isEmail();
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirmPassword', 'Passwords do not match.').equals(req.body.password);
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    /*###############################
    Place Experimental Varibles Here!
    ###############################*/
    var versions = 3;
    var varResult = ['var1', 'var2', 'var3'][Math.floor(Math.random() * versions)]

    //TODO: assigning the correct survey link according to the study group
    var surveyLink = "https://cornell.qualtrics.com/jfe/form/SV_8CdA8rLS8pjZIoJ"; //TODO

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        mturkID: req.body.mturkID,
        username: req.body.username,
        group: varResult,
        endSurveyLink: surveyLink,
        active: true,
        lastNotifyVisit: (Date.now()),
        createdAt: (Date.now())
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) { return next(err); }
        if (existingUser) {
            req.flash('errors', { msg: 'An account with that email address already exists.' });
            return res.redirect('/signup');
        }
        user.save((err) => {
            if (err) { return next(err); }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                var temp = req.session.passport; // {user: 1}
                req.session.regenerate(function(err) {
                    //req.session.passport is now undefined
                    req.session.passport = temp;
                    req.session.save(function(err) {
                        const time_now = Date.now();
                        const userAgent = req.headers['user-agent'];
                        const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        user.logUser(time_now, userAgent, user_ip);
                        res.redirect('/account/signup_info');
                    });
                });
            });
        });
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postSignupInfo = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.profile.name = req.body.name.trim() || '';
        user.profile.location = req.body.location.trim() || '';
        user.profile.bio = req.body.bio.trim() || '';

        if (req.file) {
            console.log("Changing Picture now to: " + req.file.filename);
            user.profile.picture = req.file.filename;
        }

        user.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    return res.redirect('/account/signup_info');
                }
                return next(err);
            }
            req.flash('success', { msg: 'Profile information has been updated.' });
            return res.redirect('/com');
        });
    });
};

/**
 * POST /account/interest
 * Update interest information.
 */
exports.postInterestInfo = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }

        user.interests = req.body.interests;
        user.consent = true;

        Script.find({ class: { "$in": req.body.interests } }).exec(function(err, interest_posts) {
            if (err) { return next(err); }
            interest_posts = shuffle(interest_posts);
            user.day1_posts = interest_posts.slice(0, 20);
            user.day2_posts = interest_posts.slice(20, 40);

            user.save((err) => {
                if (err) {
                    return next(err);
                }
                res.set('Content-Type', 'application/json; charset=UTF-8');
                res.send({ result: "success" });
            });

        });
    });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
    res.render('account/profile', {
        title: 'Account Management'
    });
};

/**
 * GET /me
 * Profile page.
 */
exports.getMe = (req, res) => {
    User.findById(req.user.id)
        .populate({
            path: 'posts.comments.actor',
            model: 'Actor'
        })
        .exec(function(err, user) {
            if (err) { return next(err); }
            var allPosts = user.getPosts();
            res.render('me', { posts: allPosts, title: user.profile.name || user.email || user.id });
        });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.location = req.body.location || '';
        user.profile.bio = req.body.bio || '';

        if (req.file) {
            console.log("Changing Picture now to: " + req.file.filename);
            user.profile.picture = req.file.filename;
        }

        user.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
                    return res.redirect('/account');
                }
                return next(err);
            }
            req.flash('success', { msg: 'Profile information has been updated.' });
            res.redirect('/account');
        });
    });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.password = req.body.password;
        user.save((err) => {
            if (err) { return next(err); }
            req.flash('success', { msg: 'Password has been changed.' });
            res.redirect('/account');
        });
    });
};

/**
 * POST /pageLog
 * Post a pageLog
 */
exports.postPageLog = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.logPage(Date.now(), req.body.path);
        user.save((err) => {
            if (err) {
                return next(err);
            }
            res.set('Content-Type', 'application/json; charset=UTF-8');
            res.send({ result: "success" });
        });
    });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('/forgot');
            }
            res.render('account/reset', {
                title: 'Password Reset'
            });
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    const resetPassword = () =>
        User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .then((user) => {
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('back');
            }
            user.password = req.body.password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            return user.save().then(() => new Promise((resolve, reject) => {
                req.logIn(user, (err) => {
                    if (err) { return reject(err); }
                    resolve(user);
                });
            }));
        });

    const sendResetPasswordEmail = (user) => {
        if (!user) { return; }
        const transporter = nodemailer.createTransport({
            service: 'SendPulse',
            auth: {
                user: process.env.SENDPULSE_USER,
                pass: process.env.SENDPULSE_PASSWORD
            }
        });
        const mailOptions = {
            to: user.email,
            from: 'admin@eatsnap.love',
            subject: 'Your eatsnap.love password has been changed',
            text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
        };
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('success', { msg: 'Success! Your password has been changed.' });
            });
    };

    resetPassword()
        .then(sendResetPasswordEmail)
        .then(() => { if (!res.finished) res.redirect('/'); })
        .catch(err => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    const createRandomToken = crypto
        .randomBytesAsync(16)
        .then(buf => buf.toString('hex'));

    const setRandomToken = token =>
        User
        .findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                req.flash('errors', { msg: 'Account with that email address does not exist.' });
            } else {
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user = user.save();
            }
            return user;
        });

    const sendForgotPasswordEmail = (user) => {
        if (!user) { return; }
        const token = user.passwordResetToken;
        const transporter = nodemailer.createTransport({
            service: 'Mailgun',
            auth: {
                user: process.env.MAILGUN_USER,
                pass: process.env.MAILGUN_PASSWORD
            }
        });
        const mailOptions = {
            to: user.email,
            from: 'do-not-reply@eatsnap.love',
            subject: 'Reset your password on eatsnap.love',
            text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
            });
    };

    createRandomToken
        .then(setRandomToken)
        .then(sendForgotPasswordEmail)
        .then(() => res.redirect('/forgot'))
        .catch(next);
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.mailAllActiveUsers = () => {
    console.log('$%^$%$#%$#$%%&^%&^%^&%&^$^%$%$^% MAILING ALL USERS NOW!!!!!!!!!!!!!!!');
    User.find().where('active').equals(true).exec(
        function(err, users) {

            // handle error
            if (err) {
                console.log('failed: ' + err);
            } else {
                // E-mail all active users
                for (var i = users.length - 1; i >= 0; i--) {
                    //e-mail all non-Admins
                    if (!users[i].isAdmin) {
                        sendReminderEmail(users[i]);
                    }
                }
            }
        });
};

/**
 * Turn off all old accounts. Groundhog admin accounts
 */
exports.stillActive = () => {
    User.find().where('active').equals(true).exec(
        function(err, users) {

            // handle error
            if (err) {
                console.log('failed: ' + err);
            } else {
                // E-mail all active users
                for (var i = users.length - 1; i >= 0; i--) {
                    console.log("Looking at user " + users[i].email);
                    var time_diff = Date.now() - users[i].createdAt;
                    var two_days = 172800000;

                    console.log("Time period is  " + time_diff);
                    console.log("Two days is  " + two_days);
                    if (time_diff >= two_days) {
                        if (users[i].isAdmin) {
                            users[i].createdAt = Date.now();
                            users[i].save((err) => {
                                if (err) { return next(err); }
                                console.log("Switch over to new day");
                            });
                        }

                        //normal user, turn off
                        else {
                            users[i].active = false;
                            console.log("turning off user " + users[i].email);
                            sendFinalEmail(users[i]);
                            users[i].save((err) => {
                                if (err) { return next(err); }
                                console.log("Success in turning off");
                            });
                        }
                    }

                }
            }
        });
};

/**
 * Basic information on Users that Finished the study
 */
exports.userTestResults = (req, res) => {
    //only admin can do this
    if (!req.user.isAdmin) {
        res.redirect('/');
    }
    //we are admin
    else {
        User.find().where('active').equals(false).exec(
            function(err, users) {

                // handle error
                if (err) {
                    console.log('failed: ' + err);
                } else {
                    // E-mail all active users
                    for (var i = users.length - 1; i >= 0; i--) {
                        console.log("@@@@@@@@@@Looking at user " + users[i].email);
                        var time_diff = Date.now() - users[i].createdAt;
                        var two_days = 172800000;
                        var one_day = 86400000;

                        //check if completed or not yet
                        if (!users[i].completed) {
                            //Logged in at least twice a day, and posted at least 2 times
                            if (users[i].study_days[0] >= 2 && users[i].study_days[1] >= 2 && users[i].numPosts >= 2) {
                                users[i].completed = true;
                                users[i].save((err) => {
                                    if (err) { return next(err); }
                                    console.log("I'm Finished!!!!");
                                });
                            }
                        } //if User.completed

                    } //for loop for all users!

                    res.render('completed', { users: users });

                } ///else no error
            }); //User.Find()
    }
};