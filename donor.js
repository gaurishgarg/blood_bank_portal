const mongoose = require('mongoose');
const encrypt =  require('mongoose-encryption');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const donors = mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    bloodgroup: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        unique: true,
        required: true
    },
    donoremail: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    addressl1: {
        type: String,
        required: true
    },
    addressl2: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    }
});
const donor = mongoose.model('donor',donors);
module.exports = donor;