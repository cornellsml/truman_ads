const async = require('async');
const User = require('./models/User.js');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const CSVToJSON = require("csvtojson");
const csvWriter = require('csv-write-stream');

dotenv.config({ path: '.env' });

const color_start = '\x1b[33m%s\x1b[0m'; // yellow
const color_success = '\x1b[32m%s\x1b[0m'; // green
const color_error = '\x1b[31m%s\x1b[0m'; // red

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, { useNewUrlParser: true });
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log(color_error, '%s MongoDB connection error. Please make sure MongoDB is running.');
    process.exit(1);
});

async function updatePassword() {
    // command inputs
    const myArgs = process.argv.slice(2);
    const email = myArgs[0]
    const password = myArgs[1];


    User.findOne({ email: email }, (err, existingUser) => {
        if (err) {
            return next(err);
        }
        existingUser.password = password;
        existingUser.save((err) => {
            if (err) {
                return next(err);
            }
            console.log(color_success, `Password successfully updated. Closing db connection.`);
            mongoose.connection.close();
        });
    });
}

updatePassword();