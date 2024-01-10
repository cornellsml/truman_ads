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
        { id: 'Day1_UserPostLike_received', title: 'Day1_UserPostLike_received' },
        { id: 'Day2_UserPostLike_received', title: 'Day2_UserPostLike_received' },
        { id: 'Day1_UserPostComment_received', title: 'Day1_UserPostComment_received' },
        { id: 'Day2_UserPostComment_received', title: 'Day2_UserPostComment_received' },
        { id: 'Day1_UserCommentLike_received', title: 'Day1_UserCommentLike_received' },
        { id: 'Day2_UserCommentLike_received', title: 'Day2_UserCommentLike_received' },
        { id: 'NumComments', title: 'NumComments' },
        { id: 'Day1_GeneralLikeNumber', title: 'Day1_GeneralLikeNumber' },
        { id: 'Day2_GeneralLikeNumber', title: 'Day2_GeneralLikeNumber' },
        { id: 'Day1_GeneralPostLikes', title: 'Day1_GeneralPostLikes' },
        { id: 'Day2_GeneralPostLikes', title: 'Day2_GeneralPostLikes' },
        { id: 'Day1_GeneralAdPostLikes', title: 'Day1_GeneralAdPostLikes' },
        { id: 'Day2_GeneralAdPostLikes', title: 'Day2_GeneralAdPostLikes' },
        { id: 'Day1_GeneralCommentLikes', title: 'Day1_GeneralCommentLikes' },
        { id: 'Day2_GeneralCommentLikes', title: 'Day2_GeneralCommentLikes' },
        { id: 'Day1_GeneralAdCommentLikes', title: 'Day1_GeneralAdCommentLikes' },
        { id: 'Day2_GeneralAdCommentLikes', title: 'Day2_GeneralAdCommentLikes' },
        { id: 'Day1_GeneralPostComments', title: 'Day1_GeneralPostComments' },
        { id: 'Day2_GeneralPostComments', title: 'Day2_GeneralPostComments' },
        { id: 'Day1_GeneralAdPostComments', title: 'Day1_GeneralAdPostComments' },
        { id: 'Day2_GeneralAdPostComments', title: 'Day2_GeneralAdPostComments' },
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
        const createdAt = user.createdAt; // Date user's account was created at. 

        let numPostsInDayOne = user.posts.filter(post => post.relativeTime <= one_day).length;
        let numPostsInDayTwo = user.posts.filter(post => post.relativeTime <= one_day * 2).length;

        if (numPostsInDayOne > 6) {
            numPostsInDayOne = 6;
        }
        if (numPostsInDayTwo > 6) {
            numPostsInDayTwo = 6;
        }
        const numLikesPerPost = {
            0: 0,
            1: 5,
            2: 8,
            3: 11,
            4: 16,
            5: 19,
            6: 23
        }

        record.Day1_UserPostLike_received = numLikesPerPost[numPostsInDayOne];
        record.Day2_UserPostLike_received = numLikesPerPost[numPostsInDayTwo] - numLikesPerPost[numPostsInDayOne];

        const numCommentsPerPost = {
            0: 0,
            1: 2,
            2: 3,
            3: 4,
            4: 5,
            5: 5,
            6: 6
        }

        record.Day1_UserPostComment_received = numCommentsPerPost[numPostsInDayOne];
        record.Day2_UserPostComment_received = numCommentsPerPost[numPostsInDayTwo] - numCommentsPerPost[numPostsInDayOne];

        let Day1_GeneralPostLikes = 0;
        let Day2_GeneralPostLikes = 0;
        let Day1_GeneralAdPostLikes = 0;
        let Day2_GeneralAdPostLikes = 0;
        let Day1_GeneralCommentLikes = 0;
        let Day2_GeneralCommentLikes = 0;
        let Day1_GeneralAdCommentLikes = 0;
        let Day2_GeneralAdCommentLikes = 0;
        let Day1_GeneralPostComments = 0;
        let Day2_GeneralPostComments = 0;
        let Day1_GeneralAdPostComments = 0;
        let Day2_GeneralAdPostComments = 0;

        for (const feedAction of user.feedAction) {
            if (feedAction.liked && feedAction.postClass == "Ad") {
                if (feedAction.likeTime[0] - createdAt <= one_day) {
                    Day1_GeneralAdPostLikes++;
                } else {
                    Day2_GeneralAdPostLikes++;
                }
            } else if (feedAction.liked && feedAction.postClass == "Normal")
                if (feedAction.likeTime[0] - createdAt <= one_day) {
                    Day1_GeneralPostLikes++;
                } else {
                    Day2_GeneralPostLikes++;
                }

            for (const comment of feedAction.comments) {
                if (comment.new_comment) {
                    if (comment.relativeTime <= one_day) {
                        if (feedAction.postClass == "Ad") {
                            Day1_GeneralAdPostComments++;
                        } else {
                            Day1_GeneralPostComments++;
                        }
                    } else {
                        if (feedAction.postClass == "Ad") {
                            Day2_GeneralAdPostComments++;
                        } else {
                            Day2_GeneralPostComments++;
                        }
                    }
                    continue;
                } else {
                    if (comment.liked) {
                        if (feedAction.likeTime[0] - createdAt <= one_day) {
                            if (feedAction.postClass == "Ad") {
                                Day1_GeneralAdCommentLikes++;
                            } else {
                                Day1_GeneralCommentLikes++;
                            }
                        } else {
                            if (feedAction.postClass == "Ad") {
                                Day2_GeneralAdCommentLikes++;
                            } else {
                                Day2_GeneralCommentLikes++;
                            }
                        }
                    }
                }
            }
        }

        // Post Likes
        record.Day1_GeneralPostLikes = Day1_GeneralPostLikes;
        record.Day2_GeneralPostLikes = Day2_GeneralPostLikes;
        record.Day1_GeneralAdPostLikes = Day1_GeneralAdPostLikes;
        record.Day2_GeneralAdPostLikes = Day2_GeneralAdPostLikes;
        // Comment Likes
        record.Day1_GeneralCommentLikes = Day1_GeneralCommentLikes;
        record.Day2_GeneralCommentLikes = Day2_GeneralCommentLikes;
        record.Day1_GeneralAdCommentLikes = Day1_GeneralAdCommentLikes;
        record.Day2_GeneralAdCommentLikes = Day2_GeneralAdCommentLikes;
        //Post Comments
        record.Day1_GeneralPostComments = Day1_GeneralPostComments;
        record.Day2_GeneralPostComments = Day2_GeneralPostComments;
        record.Day1_GeneralAdPostComments = Day1_GeneralAdPostComments;
        record.Day2_GeneralAdPostComments = Day2_GeneralAdPostComments;

        record.Day1_GeneralLikeNumber = Day1_GeneralPostLikes + Day1_GeneralAdPostLikes + Day1_GeneralCommentLikes + Day1_GeneralAdCommentLikes;
        record.Day2_GeneralLikeNumber = Day2_GeneralPostLikes + Day2_GeneralAdPostLikes + Day2_GeneralCommentLikes + Day2_GeneralAdCommentLikes;

        for (const post of user.posts) {
            for (const comment of post.comments) {
                if (comment.new_comment) {
                    if (comment.relativeTime <= one_day) {
                        Day1_GeneralPostComments++;
                    } else {
                        Day2_GeneralPostComments++;
                    }
                    continue;
                }
            }
        }

        Day1_GeneralPostComments = Day1_GeneralPostComments + Day1_GeneralAdPostComments;
        Day2_GeneralPostComments = Day2_GeneralPostComments + Day2_GeneralAdPostComments;

        Day2_GeneralPostComments += Day1_GeneralPostComments;
        Day2_GeneralAdPostComments += Day1_GeneralAdPostComments;

        const numLikesPerComment = {
            0: 0,
            1: 5,
            2: 8,
            3: 11,
            4: 16,
            5: 19,
            6: 23
        }

        if (Day1_GeneralPostComments > 6) {
            Day1_GeneralPostComments = 6;
        }
        if (Day2_GeneralPostComments > 6) {
            Day2_GeneralPostComments = 6;
        }
        record.NumComments = user.numComments + 1;
        record.Day1_UserCommentLike_received = numLikesPerComment[Day1_GeneralPostComments];
        record.Day2_UserCommentLike_received = numLikesPerComment[Day2_GeneralPostComments] - numLikesPerComment[Day1_GeneralPostComments];
        records.push(record);
    }
    await csvWriter.writeRecords(records);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();