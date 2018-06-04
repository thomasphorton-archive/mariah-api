var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment-timezone')

const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-west-2'
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

app.get('/time', function(req, res) {
    res.status(200).json({
        "time": moment().tz("CST").format("dddd, MMMM Do YYYY, hh:mm:ss zz")
    });
})

app.get('/time/:tz', function(req, res) {
    var timezone = req.params.tz
    var time = moment().format()
    try {
        time = moment().tz(timezone).format("dddd, MMMM Do YYYY, hh:mm:ss z")
    } catch (ex) {
        console.log(ex)
    }
    res.status(200).json({
        "time": time
    });
})

app.get('/trip/:tripId', (req, res) => {

  var tripId = req.params.tripId;

  const s3 = new AWS.S3();
  const docClient = new AWS.DynamoDB.DocumentClient();

  let geojson = {
    'id': 'route',
    'type': 'line',
    'source': {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': []
        }
      }
    },
    "layout": {
        "line-join": "round",
        "line-cap": "round"
    },
    "paint": {
        "line-color": "#888",
        "line-width": 8
    }
  }

  var params = {
    TableName:  'mariah-trip-data',
    KeyConditionExpression: 'tripId = :trip_id',
    ExpressionAttributeValues: {
      ':trip_id': tripId
    }
  }

  docClient.query(params, (err, data) => {
    if (err) {
      console.error(JSON.stringify(err, null, 2));
    } else {

      console.log(data);

      console.log('success');
      let coords = [];
      data.Items.forEach(item => {
        if (item.lon !== undefined && item.lat !== undefined) {
          coords.push([item.lon, item.lat]);
        }
      })

      geojson.source.data.geometry.coordinates = coords;

      var s3params = {
        Body: JSON.stringify(geojson),
        Bucket: 'mariah-us-west-2',
        Key: `${tripId}.json`
      }

      s3.putObject(s3params, (err, data) => {
        if (err) console.log(err, err.stack)
        else console.log(data);

        let dataUrl = `https://s3-us-west-2.amazonaws.com/mariah-us-west-2/${tripId}.json`;

        res.status(200).json({
          "tripId": tripId,
          "data": dataUrl
        })
      })
    }
  })
})

app.listen(3000, function() {
    console.log("App started")
})

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
