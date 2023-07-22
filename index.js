// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT
var path = require("path");
// include the express module
var express = require("express");

// create an express application
var app = express();
const url = require('url');

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// include the mysql module
var mysql = require("mysql");

const pug = require("pug");
app.set("views", path.join(__dirname, "client"));
app.set("view engine", "pug");

// Bcrypt library for comparing password hashes
const bcrypt = require('bcrypt');

// A  library that can help read uploaded file for bonus.
// var formidable = require('formidable')


// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false}
  ));

// server listens on port 9007 for incoming connections
app.listen(8803, () => console.log('Listening on port 8803!'));


// function to return the welcome page
app.get('/',function(req, res) {
  res.render("welcome");
});

var dbCon = mysql.createConnection({
    host: "cse-mysql-classes-01.cse.umn.edu",
    user: "C4131DF23U67",               // replace with the database user provided to you
    password: "4539",                  // replace with the database password provided to you
    database: "C4131DF23U67",           // replace with the database user provided to you
    port: 3306
});

dbCon.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));

app.get("/login", function(req, res) {
  if (req.session.user == undefined) {
    res.render("login");
  } else {
    res.redirect("/schedule");
  }
});

app.get("/schedule", function(req, res){
  if (req.session.user == undefined) {
    res.redirect("/login");
  } else {
    res.render("schedule");
  }
});

app.get("/addEvent", function(req, res) {
  if (req.session.user == undefined) {
    res.redirect("/login");
  } else {
    res.render("addEvent");
  }
});

app.get('/getSchedule', function(req,res) {
  dbCon.query('SELECT* FROM tbl_events ORDER BY event_start ASC', function(err, rs) {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader("Content-type", "application/json");
    res.write(JSON.stringify(rs));
    res.end();
  })
});

app.get("/logout", function(req, res) {
  req.session.destroy(function(err){
    if (err) {
      console.error(err);
    } else{
      res.redirect("/login")
    }
  })
});

app.get('/editEvent/:event_id', function(req, res) {
  if (req.session.user == undefined) {
    res.redirect('/login');
  } else {
    const eventId = req.params.event_id;
    console.log(eventId);
    dbCon.query('SELECT * FROM tbl_events WHERE event_id = ?', [eventId], function(err, results) {
      if (err) {
        throw err;
      }
      var event = results[0];
      console.log(event);
      res.render('editEvent', {event: event});
    });
  }
});

app.post('/updateEventEntry/:event_id', function(req, res) {
  const eventId = req.params.eventId;
  var newEvent = {
    event_day: req.body.day,
    event_event: req.body.event,
    event_start: req.body.start,
    event_end: req.body.end,
    event_location: req.body.location,
    event_phone: req.body.phone,
    event_info: req.body.info,
    event_url: req.body.url
  };
  dbCon.query('UPDATE tbl_events SET ? WHERE event_id = ?', [newEvent, eventId], function(err, req) {
    if (err) {
      throw err;
    }
    res.redirect('/schedule');
  });
});

app.delete('/deleteEvent/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  const deleteQuery = 'DELETE FROM tbl_events WHERE event_id = ?';
  dbCon.query(deleteQuery, [eventId], (err, result) => {
    if (err) {
      console.error('Error deleting event: ' + err);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  });
});

app.post('/sendLoginDetails', function(req, res) {
  dbCon.query('SELECT * FROM tbl_accounts WHERE acc_login =' + mysql.escape(req.body.username), function(err, rows){
    if (err)
      throw err;
    if (rows.length >= 1 && bcrypt.compareSync(req.body.password, rows[0].acc_password)) {
      req.session.user = req.body.username;
      res.json({success: "true"});
    } else {
      res.json({success: "false"});
    }
  });
});

app.post("/postEventEntry", function(req, res) {
  const eventsMapping = 
  {
    event_day : req.body.day, 
    event_event: req.body.event,
    event_start: req.body.start,
    event_end: req.body.end,
    event_location: req.body.location,
    event_phone: req.body.phone,
    event_info: req.body.info,
    event_url: req.body.url
  };
  dbCon.query("INSERT tbl_events SET ?", eventsMapping, function(err, rs) {
    if (err) {
      throw err;
    } else {
      res.redirect("/schedule");
    }
  })
});


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
  res.sendStatus(404);
});

