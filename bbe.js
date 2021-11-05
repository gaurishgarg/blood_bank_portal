const mongoose = require('mongoose');
const employees = mongoose.Schema({
    employee_name: {
        type: String,
        required: true,
    },
    employee_email: {
        type: String,
        required: true,
        unique: true
    },
    employee_password: {
        type: String,
        required: true
    }
});
const employee = mongoose.model('employee',employees);
module.exports = employee;
