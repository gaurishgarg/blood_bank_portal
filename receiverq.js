const mongoose = require('mongoose');
const receptionrequests = mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
    },
    age: {
        type: Number,
        required: true
    },
    bloodgroup: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    remail: {
        type: String,
        required: true
    },
    slip: {
        data: Buffer,
        contentType: String
    },
    nbb: {
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    }
});
const receiverq = mongoose.model('receptionrequest',receptionrequests);
module.exports = receiverq;