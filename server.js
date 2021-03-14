// create an express app
const express = require("express")
const request = require('request')
//var firebase = require('firebase')
const app = express()
var addressData = undefined
var airData = undefined
var forestData = undefined
let object = new Map()
var revGeoCodingUrl = "http://apis.mapmyindia.com/advancedmaps/v1/pi3yb3qxy8obnmsrjwh9lm4gghx7xvwm/rev_geocode?"
var forestDataUrl = "https://api.data.gov.in/resource/4b573150-4b0e-4a38-9f4b-ae643de88f09?api-key=579b464db66ec23bdd00000157bc862d9f2146d84b764d388c4b7319&format=json&filters[states_uts]="
var airDataUrl = "https://api.weatherbit.io/v2.0/current/airquality?key=fe3cc9eeea474df0af9999424550bdee&"
var firebaseConfig = {
    apiKey: "AIzaSyACeuNB9T7qDx_eIHe9ee_MbSYsknzws-c",
    authDomain: "forest-59f3b.firebaseapp.com",
    databaseURL: "https://forest-59f3b-default-rtdb.firebaseio.com",
    projectId: "forest-59f3b",
    storageBucket: "forest-59f3b.appspot.com",
    messagingSenderId: "960548557802",
    appId: "1:960548557802:web:00a6baa2c1eb91732c5893",
    measurementId: "G-3DSWPDVCZ1"
}


// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/newuser", function (req, res) {


    const uid = req.param("uid")
    const latitude = req.param("latitude")
    const longitude = req.param("longitude")
    
    fetchAddressData(latitude,longitude, function (address){

      addressData = address
      var state = address.state

      console.log("====== Address ======" + `${addressData.state}`)

      fetchForestData(state,function(forest){
        
        forestData = forest
        console.log("====== Forest ======" + `${forestData.geographical_area}`)

        fetchAirData(latitude,longitude, function(air){
        
          airData = air
          console.log("====== Air ======" + `${airData .aqi}`)

          initiateParametes(function(object){
              res.send(object)
          })

        }) 
      
      })
       

    })

    
    // forestData =  fetchForestData(airData.state)   

    // user = initateUser(airData,forestData)
    // writeNewUserFirebase(user)
})



function fetchAddressData(latitude,longitude,callback){
  
  revGeoCodingUrl+= "lat="+latitude + "&lng=" + longitude

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {
    
    if (err) { return console.log(err); }
   
    var address = body.results[0]
    callback(address)
  });

}

function fetchForestData(state,callback){

  forestDataUrl += state
  request(forestDataUrl, { json: true }, (err, res, body) => {

    if (err) { return console.log(err); }

    var  forest = body.records[0]
    callback(forest)
  });

}

function fetchAirData(latitude,longitude,callback){

  airDataUrl+= "lat="+latitude + "&lon=" + longitude

  request(airDataUrl, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }

    var air = body.data[0]
    callback(air)
  });

}

function initiateParametes(callback){

  var totalTreeCover = forestData._area
  var totalArea = forestData.geographical_area
  var forestDensity = (totalTreeCover/totalArea)*100
  var aqi = airData.aqi
  var normalizedScore = 1000- (aqi/forestDensity)
  var targetTrees = 0;

  if(normalizedScore >500){
      targetTrees = 4
  }else{
      targetTrees = Math.ceil((((1000-normalizedScore)/100).toDouble()))
  }

  console.log(targetTrees)


  object.set('targetTrees',targetTrees)
  object.set('normalizedScore',normalizedScore)

  callback(object)

  // writeNewUserFirebase(object)
}

// function writeNewUserFirebase(object){

//   firebase.initializeApp(firebaseConfig)
//   let database = firebase.database()

//   database.ref("customPath").update(object, function(error) {
//     if (error) {
//       // The write failed...
//       console.log("Failed with error: " + error)
//     } else {
//       // The write was successful...
//       console.log("success")
//     }
// })
// }


// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));