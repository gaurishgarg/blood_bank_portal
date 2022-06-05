const mongoose = require('mongoose');
const bloodlevel = mongoose.Schema({
APOS: {
    type: Number,
    default: 0
},
ANEG: {
    type: Number,
    default: 0
},
BPOS: {
    type: Number,
    default: 0
},
BNEG: {
    type: Number,
    default: 0
},
OPOS: {
    type: Number,
    default: 0
},
ONEG: {
    type: Number,
    default: 0
},
ABPOS: {
    type: Number,
    default: 0
},
ABNEG: {
    type: Number,
    default: 0
}
});
const bloodlevels = mongoose.model('bloodlevel',bloodlevel);
module.exports = bloodlevels;