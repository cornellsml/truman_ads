const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    // passwordResetToken: String,
    // passwordResetExpires: Date,
    username: String,
    active: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },

    endSurveyLink: String,

    numPosts: { type: Number, default: -1 }, //# of user posts
    numComments: { type: Number, default: -1 }, //# of comments on posts (user and actor), it is used for indexing and commentID of uesr comments on posts (user and actor)
    numActorReplies: { type: Number, default: -1 }, //# of actor replies on user posts, it is used for indexing and commentID of actor comments on user posts

    numPostLikes: { type: Number, default: 0 }, //# of actor posts liked
    numCommentLikes: { type: Number, default: 0 }, //# of actor comments liked

    lastNotifyVisit: Date, //Absolute Time, most recent visit to /notifications. First initialization is at account creation
    createdAt: Date, //Absolute Time user was created
    consent: { type: Boolean, default: false }, //Indicates if user has proceeded through welcome signup pages

    mturkID: String,

    group: String, //full group type for post displays. Values: 'var1', 'var2', 'var3'
    interests: [String], //List of interested cusuines chosen by user. Length = 2. Values: 'Asian', 'American', 'Italian', 'Cajun', 'Mexican'

    day1_posts: [{ type: Schema.ObjectId, ref: 'Script' }], //20 posts, pool of ads user may get on timeline on day 1 of study 
    day2_posts: [{ type: Schema.ObjectId, ref: 'Script' }], //20 posts, pool of ads user may get on timeline on day 2 of study

    tokens: Array,

    blocked: [String], //list of usernames of actors user has blocked
    reported: [String], //list of usernames of actors user has reported
    followed: [String], //list of usernames of actors user has followed
    blockReportAndFollowLog: [new Schema({
        time: Date,
        action: String,
        report_issue: String,
        actorName: String
    })],

    study_days: { //how many times the user looked at the feed per day
        type: [Number],
        default: [0, 0]
    }, //TODO: Update. It inaccurately +1, whenever creates a new post.

    // User Made posts
    posts: [new Schema({
        type: String, //Value: user_post
        postID: Number, //postID for user post (0,1,2,3...)
        body: { type: String, default: '', trim: true }, //body of post
        picture: String, //picture for post
        liked: { type: Boolean, default: false }, //has the user liked it?
        likes: { type: Number, default: 0 }, //number of likes on post by actors (excludes user's like)

        //Comments for User Made Posts
        comments: [new Schema({
            actor: { type: Schema.ObjectId, ref: 'Actor' }, //If comment is by Actor
            body: { type: String, default: '', trim: true }, //body of comment
            commentID: Number, //ID of the comment
            relativeTime: Number, //in milliseconds, relative time to when the user created their account
            absTime: Date, //Exact time comment is made
            new_comment: { type: Boolean, default: false }, //is this a comment from user?
            liked: { type: Boolean, default: false }, //has the user liked it?
            flagged: { type: Boolean, default: false }, //has the user flagged it?
            likes: { type: Number, default: 0 } //number of likes on comment by actors (excludes user's like)
        }, { versionKey: false })],

        absTime: Date, //Exact time post is made
        relativeTime: { type: Number } //in milliseconds, relative time to when the user created their account
    })],

    log: [new Schema({ //Logins
        time: Date,
        userAgent: String,
        ipAddress: String
    })],

    pageLog: [new Schema({ //Page visits
        time: Date,
        page: String //URL
    })],

    postStats: [new Schema({
        postID: Number,
        citevisits: Number,
        generalpagevisit: Number,
        DayOneVists: Number,
        DayTwoVists: Number,
        GeneralLikeNumber: Number,
        GeneralPostLikes: Number,
        GeneralCommentLikes: Number,
        GeneralFlagNumber: Number,
        GeneralPostNumber: Number,
        GeneralCommentNumber: Number
    })],

    feedAction: [new Schema({
        post: { type: Schema.ObjectId, ref: 'Script' },
        postClass: String, //indicate if the post action is done on is Ad/Normal. TODO
        rereadTimes: { type: Number, default: 0 }, //number of times post has been viewed by user. TODO

        liked: { type: Boolean, default: false }, //has the user liked it?
        flagged: { type: Boolean, default: false }, // has the user flagged it?
        likeTime: [Date], //absoluteTimes of times user has liked the post
        unlikeTime: [Date], //absoluteTimes of times user has unliked the post
        flagTime: [Date], //absoluteTimes of times user has flagged the post
        hidden: { type: Boolean, default: false }, //has the user hidden it? Used for Ads only.
        hideTime: [Date], //absoluteTimes of times user has hidden the post
        readTime: [Number], //in milliseconds, how long the user spent looking at the post (we do not record times less than 1.5 seconds and more than 24 hrs)

        comments: [new Schema({
            comment: { type: Schema.ObjectId }, //ID Reference for Script post comment
            liked: { type: Boolean, default: false }, //has the user liked it?
            flagged: { type: Boolean, default: false }, //has the user flagged it?
            likeTime: [Date], //absoluteTimes of times user has liked the 
            unlikeTime: [Date], //absoluteTimes
            flagTime: [Date], //absoluteTimes of times user has flagged the comment
            new_comment: { type: Boolean, default: false }, //is this a comment from user?
            new_comment_id: Number, //ID for comment
            body: String, //Body of comment
            absTime: Date, //Exact time comment was made
            relativeTime: Number, //in milliseconds, relative time comment was made to when the user created their account
            likes: { type: Number, default: 0 }, //
        }, { _id: true, versionKey: false })]
    }, { _id: true, versionKey: false })],

    profile: {
        name: String,
        location: String,
        bio: String,
        picture: String
    }
}, { timestamps: true, versionKey: false });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        cb(err, isMatch);
    });
};

/**
 * Add login instance to user.log
 */
userSchema.methods.logUser = function logUser(time, agent, ip) {
    var log = {
        time: time,
        userAgent: agent,
        ipAddress: ip
    };
    this.log.push(log);
    this.save((err) => {
        if (err) {
            return next(err);
        }
    });
};

/**
 * Add page visit instance to user.pageLog
 */
userSchema.methods.logPage = function logPage(time, page) {
    const log = {
        time: time,
        page: page
    };
    this.pageLog.push(log);
};

userSchema.methods.logPostStats = function logPage(postID) {
    let log = {};
    log.postID = postID;
    log.citevisits = this.log.length;
    log.generalpagevisit = this.pageLog.length;

    if (this.study_days.length > 0) {
        log.DayOneVists = this.study_days[0];
        log.DayTwoVists = this.study_days[1];
        //log.DayThreeVists = this.study_days[2];
    }

    log.GeneralLikeNumber = this.numPostLikes + this.numCommentLikes;
    log.GeneralPostLikes = this.numPostLikes;
    log.GeneralCommentLikes = this.numCommentLikes;
    log.GeneralFlagNumber = 0;

    for (var k = this.feedAction.length - 1; k >= 0; k--) {
        if (this.feedAction[k].post != null) {
            if (this.feedAction[k].liked) {
                //log.GeneralLikeNumber++;
            }
            //total number of flags
            if (this.feedAction[k].flagTime[0]) {
                log.GeneralFlagNumber++;
            }
        }
    }

    log.GeneralPostNumber = this.numPosts + 1;
    log.GeneralCommentNumber = this.numComments + 1;

    this.postStats.push(log);
};

/**
 * Helper method for getting all User Posts.
 */
userSchema.methods.getPosts = function getPosts() {
    var ret = this.posts;
    ret.sort(function(a, b) {
        return b.relativeTime - a.relativeTime;
    });
    for (const post of ret) {
        post.comments.sort(function(a, b) {
            return a.relativeTime - b.relativeTime;
        });
    }
    return ret;
};

//Return the user post from its ID
userSchema.methods.getUserPostByID = function(postID) {
    return this.posts.find(x => x.postID == postID);
};

//get user posts within the min/max time period
userSchema.methods.getPostInPeriod = function(min, max) {
    return this.posts.filter(function(post) {
        return post.relativeTime >= min && post.relativeTime <= max;
    });
}

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
    if (!size) {
        size = 200;
    }
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);
module.exports = User;