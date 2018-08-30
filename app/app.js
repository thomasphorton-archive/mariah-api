var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment-timezone');

let trip = require('./routes/trip');

require('dotenv').config();

const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION
});

// declare a new express app
var app = express()
app.use(bodyParser.json())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

app.get('/trips', trip.list);
app.get('/trip/:tripId', trip.view);

if (process.env.NODE_ENV === 'development') {
  var port = process.env.PORT || 3001;

  app.listen(port, function() {
      console.log(`Application listening on http://localhost:${port}`)
  });
}

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
