// create an express app
const express = require("express")
const request = require('request')
const http = require('http');
var admin = require('firebase-admin')
var serviceAccount = require("./servicekey.json");
const app = express()
var addressData = undefined
var airData = undefined
var forestData = undefined
var revGeoCodingUrl = "http://apis.mapmyindia.com/advancedmaps/v1/pi3yb3qxy8obnmsrjwh9lm4gghx7xvwm/rev_geocode?"
var revGeoCodingUrl2 = "https://us1.locationiq.com/v1/reverse.php?key=pk.6500b602741f3cbdb1214e8fb297041a&format=json&"
var forestDataUrl = "https://api.data.gov.in/resource/4b573150-4b0e-4a38-9f4b-ae643de88f09?api-key=579b464db66ec23bdd00000157bc862d9f2146d84b764d388c4b7319&format=json&filters[states_uts]="
var airDataUrl = "https://api.weatherbit.io/v2.0/current/airquality?key=fe3cc9eeea474df0af9999424550bdee&"

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://forest-59f3b-default-rtdb.firebaseio.com"
});

var database = admin.database()

// use the express-static middleware
app.use(express.static("public"))
const server = http.Server(app);


app.get("/newuser", function (req, res) {


  const uid = req.param("uid")
  const latitude = req.param("latitude")
  const longitude = req.param("longitude")
  
  fetchAddressData2(latitude,longitude, function (address){

    addressData = address
    var state = address.state

    console.log("Address ======> " + `${addressData.state}`)

    fetchForestData(state,function(forest){
      
      forestData = forest
      console.log("Forest ======> " + `${forestData.geographical_area}`)

      fetchAirData(latitude,longitude, function(air){
      
        airData = air
        console.log("Aqi ======> " + `${airData .aqi}`)

        initiateParametes(function(targetTrees,normalizedScore){

          var object = {'targetTrees' :targetTrees,'normalizedScore':normalizedScore,'aqi':airData.aqi,'co':airData.co,'no2':airData.no2,'o3':airData.o3,'pm10':airData.pm10,'pm25':airData.pm25,'so2':airData.so2}
          writeNewUserFirebase(uid,object,function(object){
            res.send(object)

          })

        })

      }) 
    
    })
     

  })

  
})



function fetchAddressData(latitude,longitude,callback){
  
  revGeoCodingUrl+= "lat="+latitude + "&lng=" + longitude

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {
    
    if (err) { callback(console.log(err)) }
   
    var address = body.results[0]
    callback(address)
  });

}

function fetchAddressData2(latitude,longitude,callback){
  
  revGeoCodingUrl2 += "lat="+latitude + "&lon=" + longitude

  request(revGeoCodingUrl2, { json: true }, (err, res, body) => {
    
    if (err) { return console.log(err); }
   
    var address = body.address
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
  console.log(normalizedScore)

  callback(targetTrees,normalizedScore)

}



function writeNewUserFirebase(uid,object,callback){

  var path = "/Users/" + uid
  database.ref(path).update(object, function(error) {
    if (error) {
      // The write failed...
      console.log("Failed with error: " + error)
    } else {
      // The write was successful...
      console.log("success")
      
    }
    callback(object)
  })

}

app.get("/system/reboot", (req, res)=>{
  setTimeout(function () {
      // When NodeJS exits
      process.on("exit", function () {

          require("child_process").spawn(process.argv.shift(), process.argv, {
              cwd: process.cwd(),
              detached : true,
              stdio: "inherit"
          });
      });
      process.exit();
  }, 1000);
})


// start the server listening for requests
server.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));