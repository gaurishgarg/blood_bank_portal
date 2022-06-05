const mongoose = require('mongoose');
const donationrequests = mongoose.Schema({
    emailofdonor: {
        type: String,
        required: true
    },
    dateselected: {
        type: Date,
        required: true
    },
    bloodgroup: {
        type: String,
        required: true
    },
    bloodbank: {
        type: String,
        required: true
    },
    statusfordonation: {
        type: String,
        required: true
    }

});
const donationrequest = mongoose.model('donationrequest',donationrequests);
module.exports = donationrequest;
