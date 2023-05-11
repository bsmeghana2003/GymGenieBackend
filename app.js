require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var jwt = require('jsonwebtoken');

const { MongoClient } = require("mongodb");
// Connection URI
const url = "mongodb+srv://meghana:moolarama@cluster0.ovi5vg3.mongodb.net/?retryWrites=true&w=majority";
// Create a new MongoClient
const client = new MongoClient(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    monitorCommands: true
  }
);

client.connect().then(client => {
  console.log("Connected to database");
  db = client.db("gym-genie");
})

var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(function (req, res, next) {
  req.db = db;
  next();
});

app.use('/api', usersRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
