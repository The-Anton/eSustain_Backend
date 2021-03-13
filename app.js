// create an express app
const express = require("express")
const request = require('request')
const url = require("url")

var user = require('./dataModel/user')
var addressData = require('./dataModel/addressData')
var airData = require('./dataModel/airData')
var forestData = require('./dataModel/forestData')

const app = express()

const DEMO_KEY = "h27fdmxssx2dxlp369n6ncdc7ach1wui"
var revGeoCodingUrl = "http://apis.mapmyindia.com/advancedmaps/v1/h27fdmxssx2dxlp369n6ncdc7ach1wui/rev_geocode?lat=30.3752&lng=76.7821"

// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/newuser", function (req, res) {

    const query = url.parse(url,ture).query

    const uid = query.uid
    const latitude = query.latitude
    const longitude = query.longitude
    
    addressData = fetchAddressData(latitude,longitude)
    airData = fetchAirData(latitude,longitude)  
    forestData =  fetchForestData(airData.state)   

    user = initateUser(airData,forestData)
    writeNewUserFirebase(user)
})




function fetchAddressData(latitude,longitude){

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    //console.log(res);
    console.log(body);
   // res.send("<h1>Hello World! + ${body.url} + ${body.explanation}</h1>")

  });

}

function fetchAirData(latitude,longitude){

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    //console.log(res);
    console.log(body);
   // res.send("<h1>Hello World! + ${body.url} + ${body.explanation}</h1>")

  });

}

function fetchForestData(state){

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    //console.log(res);
    console.log(body);
   // res.send("<h1>Hello World! + ${body.url} + ${body.explanation}</h1>")

  });

}


function writeNewUserFirebase(user){

}


// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));