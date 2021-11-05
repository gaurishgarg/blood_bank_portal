const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const donor = require('./donor');
const md5 = require('md5');
const conn = require('./connect');
const dotenv = require('dotenv');
const employee = require('./bbe');
const schedule = require('node-schedule');
const bloodlevels = require('./bloodlevel');
const donationrequest = require('./donationrequests');
var nodemailer = require('nodemailer');
var emailpassword = process.env.EMAILPASSWORD;
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,

    auth: {
        user: 'bloodbankcpg109@gmail.com', // like : abc@gmail.com
        pass: emailpassword // like : pass@123
    }
});

var fs = require('file-system');
var path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 10;
dotenv.config({
    path: './.env'
});
const receiverq = require('./receiverq');
var multer = require('multer');
const {
    ifError
} = require('assert');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({
    storage: storage
});
app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
})); //express uses bodyparser
app.use(express.static("public"));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/BloodBankHome.html');
    // res.render('donordashboard.ejs');
});
app.get('/BloodBankHome.html', function (req, res) {
    res.sendFile(__dirname + '/BloodBankHome.html');
    // res.render('donordashboard.ejs');
});
app.get('/index.html', function (req, res) {
    res.sendFile(__dirname + '/BloodBankHome.html');
});
app.get("/dummydonation.html", function (req, res) {
    res.sendFile(__dirname + '/dummydonation.html');
});
app.get("/dummyreceiver.html", function (req, res) {
    res.sendFile(__dirname + '/dummyreceiver.html');
});
app.post('/dummyreceiver.html', function (req, res) {
    var x1 = Number(req.body.latitude1);
    var y1 = Number(req.body.longitude1);
    var chunks = [];
    console.log("Receiver latitude " + x1 + "Receiver longitude" + y1);
    let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?fields=formatted_address%2Cname%2Cgeometry&input=blood%20bank&inputtype=textquery&locationbias=circle%3A1000%40${x1}%2C${y1}&key=${process.env.APIKEY}`;

    https.get(url, function (response) {
        if (response.statusCode === 200) {
            //res.render('myapp.ejs',{});
            response.on("data", function (data) {
                chunks.push(data);

            }).on('end', function () {
                var data = Buffer.concat(chunks);
                var schema = JSON.parse(data);
                var bloodbankreceiver = schema.candidates[0].name + " " + schema.candidates[0].formatted_address;
                //res.redirect("BloodBankReceiverPage");
                res.render('bloodreceiver.ejs', {
                    bloodbankreceiver: bloodbankreceiver
                });
            });
        } else {

        }
        console.log(response.statusCode);

    });
});

app.get("/donationregister", function (req, res) {
    res.render('blooddonation.ejs', {
        error: "",
        status: ""
    });
});
app.get("/dummydonation.html", function (req, res) {
    res.render('blooddonation.ejs', {
        error: "",
        status: ""
    });
});
app.post("/donationregister", function (req, res) {
    //on error: render donation ejs register with error
    //on data: login successful
    var fname = req.body.FirstNameBloodDonation;
    var lname = req.body.LastNameBloodDonation;
    var age = Number(req.body.AgeBloodDonation);
    var bg = req.body.BloodGroupBloodDonation;
    var mobile = req.body.MobileBloodDonation;
    var email = String(req.body.EmailBloodDonation);
    console.log(email);
    var password = req.body.SetPasswordBloodDonation;
    var al1 = req.body.AddressLine1BloodDonation;
    var al2 = req.body.AddressLine2BloodDonation;
    var city = req.body.CityBloodDonation;
    var state = req.body.StateBloodDonation;
    var pin = req.body.PINBloodDonation;
    bcrypt.hash(password, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        var newdonor = new donor({
            fname: fname,
            lname: lname,
            age: age,
            bloodgroup: bg,
            mobile: mobile,
            donoremail: email,
            password: hash,
            addressl1: al1,
            addressl2: al2,
            city: city,
            state: state,
            pin: pin
        })
        newdonor.save(function (err) {
            if (err) {
                res.render('blooddonation.ejs', {
                    error: "Email or Mobile already Exists",
                    status: ""
                });
                console.log(err);
            } else {
                res.render('blooddonation.ejs', {
                    error: "",
                    status: "Registered Successfully"
                });
            }
        });
    });
});

function WithoutTime(dateTime) {
    var date = new Date(dateTime.getTime());
    date.setHours(10, 0, 0, 0);
    return date;
}
app.post("/donorlogin", function (req, res) {
    var email = req.body.BloodDonationLogin;
    var pass = req.body.PasswordBloodDonationLogin;
    donor.findOne({
        donoremail: email
    }, function (err, data) {
        if (err) {
            console.log(err);
            //res.render errors
        } else {
            if (data) {
                bcrypt.compare(pass, data.password, function (err, result) {
                    if (result === true) {
                        //code for fetching blood banks
                        var chunks = [];
                        let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?fields=formatted_address%2Cname%2Cgeometry&input=blood%20bank%20${data.city}&inputtype=textquery&key=${process.env.APIKEY}`;

                        https.get(url, function (response) {
                            if (response.statusCode === 200) {
                                //res.render('myapp.ejs',{});
                                response.on("data", function (data1) {
                                    chunks.push(data1);

                                }).on('end', function () {
                                    var data1 = Buffer.concat(chunks);
                                    var schema = JSON.parse(data1);
                                    var banks = [];
                                    for (let i = 0; i < schema.candidates.length; i++) {
                                        banks.push(schema.candidates[i].name + " " + schema.candidates[i].formatted_address);
                                    }
                                    donationrequest.find({
                                        emailofdonor: data.donoremail
                                    }, ["_id", "emailofdonor", "dateselected", "bloodgroup", "bloodbank", "statusfordonation"], options = {
                                        sort: {
                                            dateselected: -1
                                        }
                                    }, function (err, existingrequests) {
                                        for (let i = 0; i < existingrequests.length; i++) {
                                            existingrequests[i].dateselected = WithoutTime(existingrequests[i].dateselected);
                                        }

                                        res.render('donordashboard.ejs', {
                                            donor: data,
                                            banks: banks,
                                            existingrequests: existingrequests
                                        });

                                    });
                                    //here also find the requests and send the values



                                });
                            } else {

                            }
                            console.log(response.statusCode);

                        });
                    } else {
                        res.render('blooddonorlogin.ejs', {
                            error: "Invalid Email Or Password"
                        });
                        console.log("Invalid Username or Password");
                    }
                });
            } else {
                res.render('blooddonorlogin.ejs', {
                    error: "Invalid Email Or Password"
                });
            }
        }
    });
});

app.get("/blood-bank-employee-login.html", function (req, res) {
    res.sendFile(__dirname + '/blood-bank-employee-login.html');
});
app.get("/BloodDonationLogin.html", function (req, res) {
    res.render('blooddonorlogin', {
        error: ""
    });
});

function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
app.post("/submitdonorrequest", function (req, res) {
    donationrequest.findOne({
        emailofdonor: req.body.dashboardemail
    }, ["emailofdonor", "dateselected", "bloodgroup", "bloodbank", "statusfordonation"], options = {
        sort: {
            dateselected: -1
        }
    }, function (err, result) {
        if (result) {
            var previous_date = new Date(result.dateselected);
            var selected_date = new Date(req.body.donordate);
            if (Math.abs(dateDiffInDays(previous_date, selected_date)) >= 84) {
                var newrequest = new donationrequest({
                    emailofdonor: req.body.dashboardemail,
                    dateselected: req.body.donordate,
                    bloodgroup: req.body.dashboardbloodgroup,
                    bloodbank: req.body.bloodbankselect,
                    statusfordonation: "Pending"
                });
                newrequest.save(function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render('success.ejs', {
                            message: "Request Submitted Successfully"
                        });


                    }
                });
            } else {
                //throw error
                console.log("I'm here");
                if (result.statusfordonation == "Donated") {
                    console.log("I'm in donated");
                    res.render('failure.ejs', {
                        message: "You cannot donate blood twice within three months"
                    });

                } else if (result.statusfordonation == "Pending") {
                    console.log("I'm in pending");
                    if (dateDiffInDays(previous_date, selected_date) < 7) {
                        res.render('failure.ejs', {
                            message: "You can't place multiple requests within 7 days"
                        });

                    } else {
                        var newrequest = new donationrequest({
                            emailofdonor: req.body.dashboardemail,
                            dateselected: req.body.donordate,
                            bloodgroup: req.body.dashboardbloodgroup,
                            bloodbank: req.body.bloodbankselect,
                            statusfordonation: "Pending"
                        });
                        newrequest.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {

                                res.render('success.ejs', {
                                    message: "Request Submitted Successfully"
                                });


                            }
                        });
                    }
                } else {
                    var newrequest = new donationrequest({
                        emailofdonor: req.body.dashboardemail,
                        dateselected: req.body.donordate,
                        bloodgroup: req.body.dashboardbloodgroup,
                        bloodbank: req.body.bloodbankselect,
                        statusfordonation: "Pending"
                    });
                    newrequest.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.render('success.ejs', {
                                message: "Request Submitted Successfully"
                            });

                        }
                    });

                }


            }

        } else {
            //just save here
            var newrequest = new donationrequest({
                emailofdonor: req.body.dashboardemail,
                dateselected: req.body.donordate,
                bloodgroup: req.body.dashboardbloodgroup,
                bloodbank: req.body.bloodbankselect,
                statusfordonation: "Pending"
            });
            newrequest.save(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.render('success.ejs', {
                        message: "Request Submitted Successfully"
                    });


                }
            });

        }

    });
})
var rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.tz = 'UTC+05:30';

function updatedatabasebasedondate() {
    var today = new Date();
    donationrequest.updateMany({
        dateselected: {
            $lt: today
        },
        statusfordonation: "Pending"
    }, {
        statusfordonation: "Absent"
    }, function (err, result) {

    });
};
const job = schedule.scheduleJob(rule, function () {
    console.log("Every Midnight");
    updatedatabasebasedondate();

});
updatedatabasebasedondate();
app.get("/bberegister", function (req, res) {
    res.sendFile(__dirname + '/bberegister.html');
})
app.post("/bbe", function (req, res) {
    var name = req.body.NameBloodBankEmployeeRegister;
    var email = req.body.EmailBloodBankEmployeeRegister;
    var password = req.body.PasswordBloodBankEmployeeRegister;
    bcrypt.hash(password, saltRounds, function (err, hash) {
        var employees = new employee({
            employee_name: name,
            employee_email: email,
            employee_password: hash
        });
        employees.save(function (err, employee_data) {
            if (err) {
                console.log(err);
                res.render('failure.ejs', {message: err});
            } else {
                res.render('success.ejs', {message: "Submitted Successfully"});
                if (employee_data) {
                    console.log(employee_data);
                }
            }

        });
    });

});
app.post("/bbelogin", function (req, res) {
    var email_of_employee = req.body.EmailBloodBankEmployee;
    var password_of_employee = req.body.PasswordBloodBankEmployee;
    employee.findOne({
        employee_email: email_of_employee
    }, ["_id", "employee_name", "employee_email", "employee_password"], function (err, data) {
        if (err) {
            console.log(err);
        } else {
            if (data) {

                bcrypt.compare(password_of_employee, data.employee_password, function (err1, result) {
                    if (err1) {
                        console.error(err1);
                    } else {
                        if (result) {
                            //console.log(data);
                            var today = new Date();
                            receiverq.find({
                                status: "Pending"
                            }, ["_id", "fname", "lname", "age", "bloodgroup", "mobile", "remail", "slip", "nbb", "status"], function (err, receiverrequests) {

                                donationrequest.find({
                                    statusfordonation: "Pending",
                                    dateselected: {
                                        $lte: today
                                    }
                                }, ["_id", "emailofdonor", "dateselected", "bloodgroup", "bloodbank", "statusfordonation"], options = {
                                    sort: {
                                        dateselected: -1
                                    }
                                }, function (err, userdonationrequests) {
                                   
                                    receiverq.find({
                                        status: "Approved"
                                    }, ["_id", "fname", "lname", "age", "bloodgroup", "mobile", "remail", "slip", "nbb", "status"], function (err, approvedrequests) {
                                        res.render('bloodbanklogin.ejs', {
                                            bloodreq: receiverrequests,
                                            donorreq: userdonationrequests,
                                            employeedata: data,
                                            approvedreq: approvedrequests
                                        });
                                    })


                                });



                            });

                            //find donation and receiver REQUESTS
                            //send data via callback

                        } else {
                            res.render('failure.ejs', {message: "Invalid Email ID or Password"});
                            

                        }
                    }

                });


            } else {
                res.render('failure.ejs', {message: "Invalid Email ID or Password"});
                console.log("Invalid Email ID or password");
            }
        }
    })
});
app.post("/receiverrequests", upload.single('BloodRequestSlipBloodReception'), function (req, res, next) {
    var userreceptionrequest = new receiverq({
        fname: req.body.FirstNameBloodReception,
        lname: req.body.LastNameBloodReception,
        age: Number(req.body.AgeBloodReception),
        bloodgroup: req.body.BloodGroupBloodReception,
        mobile: Number(req.body.MobileBloodReception),
        remail: req.body.EmailBloodReception,
        slip: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/*'
        },
        nbb: req.body.BloodReceiverBank,
        status: "Pending"
    });
    userreceptionrequest.save(function (err, data) {
        if (err) {
            console.log(err);
        } else {
            res.render('success.ejs', {message: "Submitted"});
            
        }
    })
});
app.post("/onscrutiny", function (req, res) {
    console.log(req.body.requestemail);
    if (req.body.newstatus == "Approved" || req.body.newstatus == "Denied") {
        receiverq.findByIdAndUpdate(req.body.requestid, {
            status: req.body.newstatus
        }, function (err, data) {
            if (err) {
                console.log(err);
                res.render('failure.ejs', {message: "An unexpected error occured"});                
            } else {}
        });
        //put code for sending status here
        var mailOptions = {
            from: 'bloodbankcpg109@gmail.com',
            to: req.body.requestemail,
            subject: 'Your Blood Receiving Request was ' + req.body.newstatus,
            text: 'Your Blood Receiving Request with request id ' + req.body.requestid + ' was ' + req.body.newstatus
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        //end of status code
        
        res.render('success.ejs', {message: "Submitted Successfully"});
    } else {
        res.render('failure.ejs', {message: "Not a valid option"});
        
    }

});
app.post("/afterapproved", function (req, res) {
    bloodlevels.find(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            var APOS = 0;
            var ANEG = 0;
            var BPOS = 0;
            var BNEG = 0;
            var OPOS = 0;
            var ONEG = 0;
            var ABPOS = 0;
            var ABNEG = 0;
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].APOS);
                APOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ANEG);
                ANEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].BPOS);
                BPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].BNEG);
                BNEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].OPOS);
                OPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ONEG);
                ONEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ABPOS);
                ABPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ABNEG);
                ABNEG += x;
            }
            if (req.body.UpdatedStatus == "Received") {
                if (req.body.bloodgroupreceived == "A+") {
                    if (APOS < Number(req.body.bloodgroupunits)) {                        
                        res.render('failure.ejs', {message: "Low on Blood"});
                    } else {
                        var bloodlevel = new bloodlevels({
                            APOS: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                                
                            } else {}
                        });


                    }
                    //console.log(req.body.bloodgroupreceived);

                } else if (req.body.bloodgroupreceived == "A-") {
                    if (ANEG < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            ANEG: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                                
                            } else {}
                        });


                    }

                } else if (req.body.bloodgroupreceived == "B+") {
                    if (BPOS < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});
                    } else {
                        var bloodlevel = new bloodlevels({
                            BPOS: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});                                
                            } else {}
                        });

                    }

                } else if (req.body.bloodgroupreceived == "B-") {
                    if (BNEG < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            BNEG: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                                
                            } else {}
                        });
                    }

                } else if (req.body.bloodgroupreceived == "O+") {
                    if (OPOS < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            OPOS: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                            } else {}
                        });
                    }

                } else if (req.body.bloodgroupreceived == "O-") {
                    if (ONRG < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            ONEG: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                                
                            } else {}
                        });
                    }

                } else if (req.body.bloodgroupreceived == "AB+") {
                    if (ABPOS < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            ABPOS: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                                
                            } else {}
                        });
                    }

                } else if (req.body.bloodgroupreceived == "AB-") {
                    if (ABNEG < Number(req.body.bloodgroupunits)) {
                        res.render('failure.ejs', {message: "Low on Blood"});

                    } else {
                        var bloodlevel = new bloodlevels({
                            ABNEG: -Number(req.body.bloodgroupunits)
                        });
                        bloodlevel.save(function (err, data) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.render('success.ejs', {message: "Submitted Successfully"});
                        receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                            status: req.body.UpdatedStatus
                        }, function (err, data) {
                            if (err) {
                                console.log(err);
                                res.render('failure.ejs', {message: "An unexpected error occured"});
                            } else {}
                        });
                    }
                } else {


                }

            } else {
                res.render('success.ejs', {message: "Submitted Successfully"});
                receiverq.findByIdAndUpdate(req.body.oncollectionrequestid, {
                    status: req.body.UpdatedStatus
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                        res.render('failure.ejs', {message: "An unexpected error occured"});
                        
                    } else {}
                });

            }

        }
    });


});
app.post("/ondonationrequestdonated", function (req, res) {
    //code for updating status goes here
    if (req.body.donationupdatedstatus == "Donated") {
        donationrequest.findByIdAndUpdate(req.body.donationrequestid, {
            statusfordonation: req.body.donationupdatedstatus
        }, function (err, data) {
            if (err) {

            } else {

            }
        })
        res.render('success.ejs', {message: "Submitted Successfully"});

        if (req.body.donationrequestbloodgroup.includes("A+")) {
            //console.log("Logged Successfully");
            var bloodlevel = new bloodlevels({
                APOS: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("A-")) {
            var bloodlevel = new bloodlevels({
                ANEG: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("B+")) {
            var bloodlevel = new bloodlevels({
                BPOS: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("B-")) {
            var bloodlevel = new bloodlevels({
                BNEG: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("O+")) {
            var bloodlevel = new bloodlevels({
                OPOS: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("O-")) {
            var bloodlevel = new bloodlevels({
                ONEG: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("AB+")) {
            var bloodlevel = new bloodlevels({
                ABPOS: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        } else if (req.body.donationrequestbloodgroup.includes("AB-")) {
            var bloodlevel = new bloodlevels({
                ABNEG: Number(req.body.unitsdonated)
            });
            bloodlevel.save(function (err, data) {
                if (err) {
                    console.log(err);
                }
            });
        }

    } else {
        donationrequest.findByIdAndUpdate(req.body.donationrequestid, {
            statusfordonation: req.body.donationupdatedstatus
        }, function (err, data) {});
    }
});
app.get("/findbloodlevels", function (req, res) {
    bloodlevels.find(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            var APOS = 0;
            var ANEG = 0;
            var BPOS = 0;
            var BNEG = 0;
            var OPOS = 0;
            var ONEG = 0;
            var ABPOS = 0;
            var ABNEG = 0;
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].APOS);
                APOS += x;
            }
            console.log(APOS);
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ANEG);
                ANEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].BPOS);
                BPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].BNEG);
                BNEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].OPOS);
                OPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ONEG);
                ONEG += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ABPOS);
                ABPOS += x;
            }
            for (let i = 0; i < result.length; i++) {
                var x = Number(result[i].ABNEG);
                ABNEG += x;
            }
            var total = (APOS + ANEG + BPOS + BNEG + OPOS + ONEG + ABPOS + ABNEG);
            var bloodlevelshow = {
                APOS: APOS,
                ANEG: ANEG,
                BPOS: BPOS,
                BNEG: BNEG,
                OPOS: OPOS,
                ONEG: ONEG,
                ABPOS: ABPOS,
                ABNEG: ABNEG
            }
            res.render('bloodlevels.ejs', {
                levels: bloodlevelshow
            });

        }
    });

});
//now need to show the requests to blood bank employees done
//in just need to find() in bloodbankemployee and show done
//will show only pending status done
//till now we have done mailing done
//now only displaying of blood levels is left
//then we will be doing css only
app.get("/contact.html", function (req, res) {
    res.send("Contact Us: CPG 109");

});
app.get("/successpage", function (req, res) {
    var message = "Try";
    res.render('success.ejs', {
        message: message
    });
});
app.get("/failurepage", function (req, res) {
    var message = "Catch";
    res.render('failure.ejs', {
        message: message
    });
});
module.exports = app;