const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const Script = require('./models/Script.js');
const User = require('./models/User.js');
const Actor = require('./models/Actor.js');
const mongoose = require('mongoose');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Console.log color shortcuts
const color_start = '\x1b[33m%s\x1b[0m'; // yellow
const color_success = '\x1b[32m%s\x1b[0m'; // green
const color_error = '\x1b[31m%s\x1b[0m'; // red

// establish initial Mongoose connection, if Research Site
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });
// listen for errors after establishing initial connection
db = mongoose.connection;
db.on('error', (err) => {
    console.error(err);
    console.log(color_error, '%s MongoDB connection error.');
    process.exit(1);
});
console.log(color_success, `Successfully connected to db.`);

/*
  Gets the user models from the database, or folder of json files.
*/
async function getUserJsons() {
    const users = await User.find({ isAdmin: false }).exec();
    return users;
}

async function getActors() {
    const users = await Actor.find({ class: "" }).exec();
    return users.map(user => user.username);
}

async function getAdActors() {
    const users = await Actor.find({ class: { $ne: "" } }).exec();
    return users.map(user => user.username);
}

async function getPostById(id) {
    const post = await Script.find({ _id: id }).exec();
    return post;
}

async function getDataExport() {
    const users = await getUserJsons();
    const adActors = await getAdActors();
    const actors = await getActors();

    console.log(color_start, `Starting the data export script...`);
    const currentDate = new Date();
    const outputFilename =
        `truman_Ads-dataExport` +
        `.${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}` +
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    const outputFilepath = `./outputFiles/${outputFilename}.csv`;
    const csvWriter_header = [
        { id: 'email', title: "Participant Email" },
        { id: 'id', title: "Prolific ID" },
        { id: 'Foodstyle1', title: 'Foodstyle1' }, //Cuisine #1
        { id: 'Foodstyle2', title: 'Foodstyle2' }, //Cusuine #2
        { id: 'Condition', title: 'Condition' }, //Condition
        { id: 'CompletedStudy', title: 'CompletedStudy' }, //Indicating if the user has completed all the requirements for all 2 days
        { id: 'MinimumOneDayCompleted', title: 'MinimumOneDayCompleted' }, //Indicating if the user has completed all the requirements for at least 1 day
        { id: 'CompletedDay1', title: 'CompletedDay1' }, //If user has completed all the requirements above for Day 1
        { id: 'CompletedDay2', title: 'CompletedDay2' }, //If user has completed all the requirements above for Day 2
        { id: 'SiteVisits', title: 'SiteVisits' }, //Total number of times the user has logged into website
        { id: 'VisitsLog', title: 'VisitsLog (Eastern Time)' }, //Time stamps of each visit
        { id: 'Day1_visit', title: 'Day1_visit' }, //# of times the user has logged into the website on Day 1
        { id: 'Day2_visit', title: 'Day2_visit' }, //# of times the user has logged into the website on Day 2
        { id: 'Generaltimespent', title: 'Generaltimespent (seconds)' }, //Amount of time spent on the website during Day 1 and Day 2
        { id: 'Day1_timespent', title: 'Day1_timespent (seconds)' }, //Amount of time spent on the website during Day 1
        { id: 'Day2_timespent', title: 'Day2_timespent (seconds)' }, //Amount of time spent on the website during Day 2
        { id: 'Generaltimespent_postbased', title: 'Generaltimespent (seconds; based on post view times)' },
        { id: 'NumPostSeen', title: 'NumPostSeen' }, //Number of non-ad posts seen 
        { id: 'NumAdPostSeen', title: 'NumAdPostSeen' }, //Number of ad posts seen
        { id: 'AvgTimePost', title: 'AvgTimePost (seconds)' }, //Average time spent on normal (non-ad) posts
        { id: 'AvgTimeAdPost', title: 'AvgTimeAdPost (seconds)' }, //Average time spent on ad posts
        { id: 'GeneralPostNumber', title: 'GeneralPostNumber' }, //# of posts user has created
        { id: 'Day1_posts', title: 'Day1_posts' }, //# of posts user created on Day 1
        { id: 'Day2_posts', title: 'Day2_posts' }, //# of posts user created on Day 2
        { id: 'GeneralLikeNumber', title: 'GeneralLikeNumber' }, //# of likes on actor posts and actor comments
        { id: 'GeneralPostLikes', title: 'GeneralPostLikes' }, //# of likes on normal (non-ad) posts
        { id: 'GeneralAdPostLikes', title: 'GeneralAdPostLikes' }, //# of likes on ad posts
        { id: 'GeneralCommentLikes', title: 'GeneralCommentLikes' }, //# of likes on actor comments on normal (non-ad) posts
        { id: 'GeneralAdCommentLikes', title: 'GeneralAdCommentLikes' }, //# of likes on actor comments on ad posts
        { id: 'GeneralPostComments', title: 'GeneralPostComments' }, //# of comments made on normal (non-ad) posts
        { id: 'GeneralAdPostComments', title: 'GeneralAdPostComments' }, //# of comments made on ads
        { id: 'GeneralVisitProfile', title: 'GeneralVisitProfile' }, //# of times user visits an actor (non-ad) profile
        { id: 'GeneralAdVisitProfile', title: 'GeneralAdVisitProfile' }, //# of times user visits an ad profile
        { id: 'GeneralHideAds', title: 'GeneralHideAds' }, //# of ads hidden
        { id: 'Day1_removeads', title: 'Day1_removeads' }, //Ads hidden on Day 1
        { id: 'Day2_removeads', title: 'Day2_removeads' }, //Ads hidden on Day 2
        { id: 'GeneralFollowProfile', title: 'GeneralFollowProfile' }, //# of actor (non-ad) profiles followed
        { id: 'GeneralFollowAdProfile', title: 'GeneralFollowAdProfile' }, //# of ad profile followed
        { id: 'AdPlacements_Day1', title: 'AdPlacements_Day1' }, //Ad Placements on Day 1
        { id: 'AdPlacements_Day2', title: 'AdPlacements_Day2' } //Ad Placements on Day 2
    ];
    const csvWriter = createCsvWriter({
        path: outputFilepath,
        header: csvWriter_header
    });
    const records = [];
    // For each user
    for (const user of users) {
        const one_day = 86400000; //number of milliseconds in a day
        const record = {}; //Record for the user

        record.email = user.email;
        record.id = user.mturkID;
        record.Foodstyle1 = user.interests[0];
        record.Foodstyle2 = user.interests[1];
        record.Condition = user.group == "var1" ? 5 : user.group == "var2" ? 4 : 2;

        const Day1_timespent = user.pageTimes[0];
        const Day2_timespent = user.pageTimes[1];
        const Day1_posts = user.posts.filter(post => post.relativeTime <= one_day).length;
        const Day2_posts = user.posts.filter(post => post.relativeTime > one_day && post.relativeTime <= one_day * 2).length;

        const CompletedDay1 = Day1_posts >= 1 && Day1_timespent > 180000;
        const CompletedDay2 = Day2_posts >= 1 && Day2_timespent > 180000;

        record.CompletedStudy = CompletedDay1 && CompletedDay2;
        record.MinimumOneDayCompleted = CompletedDay1 || CompletedDay2;
        record.CompletedDay1 = CompletedDay1;
        record.CompletedDay2 = CompletedDay2;

        //SiteVisits, Day1_visit, Day2_visit 
        record.SiteVisits = user.log.length;
        record.VisitsLog = user.log.reduce(function(string, a) { return string + a.time.toLocaleString("en-US", { timeZone: "America/New_York" }) + "\n" }, "")
        record.Day1_visit = user.log.filter(log => log.time - user.createdAt <= one_day).length;
        record.Day2_visit = user.log.filter(log => (log.time - user.createdAt > one_day) && (log.time - user.createdAt <= one_day * 2)).length;

        record.Generaltimespent = (user.pageTimes[0] + user.pageTimes[1]) / 1000;
        record.Day1_timespent = user.pageTimes[0] / 1000;
        record.Day2_timespent = user.pageTimes[1] / 1000;

        //AvgTimePost, AvgTimeAdPost
        const nonAdPosts = user.feedAction.filter(post => post.postClass == "Normal");
        const AdPosts = user.feedAction.filter(post => post.postClass == "Ad");
        // let nonAdPostsCount = 0;
        // let AdPostsCount = 0;
        let nonAdPostsCount = nonAdPosts.length;
        let AdPostsCount = AdPosts.length;

        const sumTimeNonAdPosts = nonAdPosts.reduce(function(partialSum, post) {
            return partialSum + post.readTime.reduce(function(partialRSum, a) {
                // nonAdPostsCount++;
                return partialRSum + a
            }, 0);
        }, 0);
        const sumTimeAdPosts = AdPosts.reduce(function(partialSum, post) {
            return partialSum + post.readTime.reduce(function(partialRSum, a) {
                // AdPostsCount++;
                return partialRSum + a
            }, 0);
        }, 0);

        record.TimeSpent_postbased = (sumTimeNonAdPosts + sumTimeAdPosts) / 1000;

        record.NumPostSeen = nonAdPosts.length;
        record.NumAdPostSeen = AdPosts.length;
        record.AvgTimePost = (sumTimeNonAdPosts / nonAdPostsCount) / 1000;
        record.AvgTimeAdPost = (sumTimeAdPosts / AdPostsCount) / 1000;

        record.GeneralPostNumber = user.posts.length;
        record.Day1_posts = Day1_posts;
        record.Day2_posts = Day2_posts;

        const GeneralPostLikes = user.feedAction.filter(post => post.liked && post.postClass == "Normal").length;
        const GeneralAdPostLikes = user.feedAction.filter(post => post.liked && post.postClass == "Ad").length;

        const counts = user.feedAction.reduce(function(newCount, feedAction) {
            const postType = feedAction.postClass == "Ad" ? 1 : 0;
            const numLikes = feedAction.comments.filter(comment => comment.liked && !comment.new_comment).length;
            const numNewComments = feedAction.comments.filter(comment => comment.new_comment).length;

            newCount[postType][0] += numLikes;
            newCount[postType][1] += numNewComments;
            return newCount;
        }, [
            [0, 0], //Normal Post [actorLikes, newComments]
            [0, 0] //Ad Post[actorLikes, newComments]
        ]);

        record.GeneralLikeNumber = GeneralPostLikes + GeneralAdPostLikes + counts[0][0] + counts[1][0];
        record.GeneralPostLikes = GeneralPostLikes;
        record.GeneralAdPostLikes = GeneralAdPostLikes;
        record.GeneralCommentLikes = counts[0][0];
        record.GeneralAdCommentLikes = counts[1][0];

        record.GeneralPostComments = counts[0][1];
        record.GeneralAdPostComments = counts[1][1];

        let GeneralVisitProfile = 0;
        let GeneralAdVisitProfile = 0;

        const pages = user.pageLog.map(pageObj => pageObj.page);

        pages.forEach(function(page) {
            if (page.startsWith('/user/')) {
                const user = page.replace('/user/', "");
                if (adActors.includes(user)) {
                    GeneralAdVisitProfile++;
                }
                if (actors.includes(user)) {
                    GeneralVisitProfile++;
                }
            }
        });
        record.GeneralVisitProfile = GeneralVisitProfile;
        record.GeneralAdVisitProfile = GeneralAdVisitProfile;

        let GeneralFollowProfile = 0;
        let GeneralFollowAdProfile = 0;
        user.followed.forEach(function(page) {
            if (adActors.includes(page)) {
                GeneralFollowAdProfile++;
            }
            if (actors.includes(page)) {
                GeneralFollowProfile++;
            }
        });
        record.GeneralFollowProfile = GeneralFollowProfile;
        record.GeneralFollowAdProfile = GeneralFollowAdProfile;

        record.GeneralHideAds = user.feedAction.filter(post => post.hidden && post.postClass == "Ad").length;

        let Day1_removeads = [];
        let Day2_removeads = [];
        let Day1_removeads_count = 0;
        let Day2_removeads_count = 0;

        user.feedAction.forEach(async function(feedAction) {
            if (feedAction.hidden && feedAction.postClass == "Ad") {
                const time = feedAction.hideTime[0] - user.createdAt;
                // const post = await getPostById(feedAction.post);
                // const postBody = post.body;
                if (time <= one_day) {
                    // Day1_removeads.push(postBody);
                    Day1_removeads_count++;
                }
                if (time > one_day && time <= one_day * 2) {
                    // Day2_removeads.push(postBody);
                    Day2_removeads_count++;
                }
            }
        });
        // record.Day1_removeads = Day1_removeads;
        // record.Day2_removeads = Day2_removeads;
        record.Day1_removeads = Day1_removeads_count;
        record.Day2_removeads = Day2_removeads_count;

        let AdPlacements_Day1 = "";
        let AdPlacements_Day2 = "";
        user.adPlacements[0].forEach(function(rowArray) {
            let row = rowArray.join(",");
            AdPlacements_Day1 += row + "\r\n";
        });
        user.adPlacements[1].forEach(function(rowArray) {
            let row = rowArray.join(",");
            AdPlacements_Day2 += row + "\r\n";
        });
        record.AdPlacements_Day1 = AdPlacements_Day1;
        record.AdPlacements_Day2 = AdPlacements_Day2;

        records.push(record);
    }

    await csvWriter.writeRecords(records);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();