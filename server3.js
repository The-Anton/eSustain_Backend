const express = require("express")
const request = require('request')
const http = require('http');
var admin = require('firebase-admin')
var serviceAccount = require("./servicekey.json");
const { resolve } = require("path");
const e = require("express");
// const airApiService = require("./apiService/airApiDataService.mjs");
// const forestApiService = require("./apiService/forestApiDataService.mjs");
// const groundWaterApiService = require("./apiService/groundWaterApiDataService.mjs");
// const addressApiService = require("./apiService/");
// const firebaseService = require("./apiService/firebaseService.mjs");
const app = express()
var revGeoCodingUrl = "http://apis.mapmyindia.com/advancedmaps/v1/pi3yb3qxy8obnmsrjwh9lm4gghx7xvwm/rev_geocode?"
var revGeoCodingUrl2 = "https://us1.locationiq.com/v1/reverse.php?key=pk.6500b602741f3cbdb1214e8fb297041a&format=json&"
var forestDataUrl = "https://api.data.gov.in/resource/4b573150-4b0e-4a38-9f4b-ae643de88f09?api-key=579b464db66ec23bdd00000157bc862d9f2146d84b764d388c4b7319&format=json&filters[states_uts]="
var airDataUrl = "https://api.weatherbit.io/v2.0/current/airquality?key=fe3cc9eeea474df0af9999424550bdee&"

var isLoading = false

var nullResponse = {
  'normalizedScore':0.0,
  'aqi':0.0,
  'co':0.0,
  'no2':0.0,
  'o3':0.0,
  'pm10':0.0,
  'pm25':0.0,
  'so2':0.0,
  'recommendedTarget' :0,
  'forestDensity':0.0,
  'totalArea':0,
  'noForest':0,
  'openForest':0,
  'actualForest':0,
  'city':"city",
  'state':"state",
  'apistatus':false,
  'country':"country",
  updated:false
}
// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://forest-59f3b-default-rtdb.firebaseio.com"
});

var database = admin.database()
const dbfirestore = admin.firestore();

// use the express-static middleware
app.use(express.static("public"))
const server = http.Server(app);


console.log("This is pid " + process.pid);




app.get("/newuser", function (req, res) {

  const uid = req.param("uid")
  const latitude = req.param("latitude")
  const longitude = req.param("longitude")
  
  createUserData(uid,latitude,longitude,res)
   

})







async function createUserData(uid,latitude,longitude,res){

    try{
        var addressData = await fetchAddress(latitude,longitude)
        var airData = await fetchAirData(latitude,longitude)
        var state = addressData.state.toLowerCase()
        var city = addressData.state_district.toLowerCase()
        var forestData = await fetchForestData(state)
        var groundwaterData = await fetchGroundWaterData(state,city)
        var finalData = initiateParams(latitude,longitude, addressData,airData,forestData,groundwaterData)
        await writeNewUserFirebase(uid,finalData)
        res.send(finalData)
        restartInstance()
    }
        catch(error){
            console.log(error)
            res.send(nullResponse)
            restartInstance()
        }
    
}



function fetchAddress(latitude,longitude){

  return new Promise((resolve,reject) => {

        revGeoCodingUrl2 += "lat="+latitude + "&lon=" + longitude

        request(revGeoCodingUrl2, { json: true }, (err, res, body) => {
        
            if (err) {
                console.error('fetch failed:', err);
                reject(err)
            }else{
                var address = body.address
                console.error(address);
                resolve(address)
            }
            
        })
  
  })
}


function fetchForestData(state){

  // forestDataUrl += state
  // console.log("fetching forest data")

  
  // request(forestDataUrl, { json: true }, (err, res, body) => {

  //   //console(console.log(err))
  //   if (err) {
  //     return console.error('fetch failed:', err);
  //   }
  //   var  forest = body.records[0]
  //   callback(forest)
  // })


  return new Promise((resolve,reject) =>{
    state = state.toLowerCase()
    var ref = database.ref(`stateForestData/${state}`);
  
    // Attach an asynchronous callback to read the data at our posts reference
    ref.on("value", function(snapshot) {
      //console.log(snapshot.val().geoarea);
      var forestObject = {"geo":snapshot.val().geoarea,"nf":snapshot.val().noforest,"af":snapshot.val().actualforestcover,"of":snapshot.val().openforest}
      console.log(forestObject)
      resolve(forestObject)
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
      reject(errorObject)
    });
  })
  



}


function fetchAirData(latitude,longitude){

    return new Promise((resolve, reject) => {
        airDataUrl+= "lat="+latitude + "&lon=" + longitude

        request(airDataUrl, { json: true }, (err, res, body) => {
            if (err) {
                console.error('fetch failed:', err)
                reject(err)
            }else{
                var air = body.data[0]
                console.log(air)
                resolve(air)
            }
            
        })
    })
  

}


function fetchGroundWaterData(state,district){

     return new Promise((resolve,reject)=>{
        state = state.toLowerCase()
        district = district.toLowerCase()
        const cityRef = dbfirestore.collection('groundWaterData').doc(`/india/${state}/${district}`);
       
           (async () => {
            doc =  await cityRef.get();
            if (!doc.exists) {
                console.error('No ground water document exsist!');
                
                reject('No ground water document exsist!')
            } else {
                var list = [
                  
                doc.data().annual_allocation_domestic_2025.toString(),
                  doc.data().annual_extractable.toString(),
                  doc.data().annual_extraction.toString(),
                  doc.data().annual_extraction_domestic_industrial_use.toString(),
                  doc.data().annual_extraction_irrigation.toString(),
                  doc.data().annual_recharge.toString(),
                  doc.data().future_availability.toString(),
                  doc.data().recharge_other_monsoon.toString(),
                  doc.data().recharge_other_non_monsoon.toString(),
                  doc.data().recharge_rainfall_monsoon.toString(),
                  doc.data().recharge_rainfall_non_monsoon.toString(),
                  doc.data().stage.toString(),
                  doc.data().total_natural_discharges.toString()
            ]
                console.log('Document data:', list);
                resolve(list)
            }
          })();
         
    })
  

}


function initiateParams(latitude, longitude, addressData,airData,forestData,groundwater){


  var obj = new Map()

  //forest
  obj["openForest"] = parseInt(forestData.of)
  obj["totalArea"] = parseInt(forestData.geo)
  obj["forestDensity"] = (obj["openForest"]/obj["totalArea"])*100
  var aqi = airData.aqi
  obj["normalizedScore"] = 1000 - ((aqi*groundwater[11])/(obj["forestDensity"]*10))
  obj["recommendedTarget"] = 0;
  obj["noForest"] =parseInt(forestData.nf);
  obj["actualForest"]=parseInt(forestData.af);

  if(obj["normalizedScore"] >500){
    obj["recommendedTarget"] = 4
  }else{
    obj["recommendedTarget"] = Math.ceil((((1000-obj["normalizedScore"])/100).toDouble()))
  }
  //groundwater
  obj["groundWaterData"] = groundwater

  console.log(obj["recommendedTarget"])
  console.log(obj["normalizedScore"])
  var locationObj = {'0':latitude.toString(), '1':longitude.toString()}

  var object = {
    'normalizedScore':obj["normalizedScore"],
    'aqi':airData.aqi,
    'co':airData.co,
    'no2':airData.no2,
    'o3':airData.o3,
    'location':locationObj,
    'pm10':airData.pm10,
    'pm25':airData.pm25,
    'so2':airData.so2,
    'recommendedTarget' :obj["recommendedTarget"],
    'forestDensity':obj["forestDensity"],
    'totalArea':obj["totalArea"],
    'noForest':obj["noForest"],
    'openForest':obj["openForest"],
    'actualForest':obj["actualForest"],
    'city':addressData.state_district.toString(),
    'state':addressData.state.toString(),
    'apistatus':true,
    'groundWaterData':obj["groundWaterData"],
    'country':addressData.country.toString(),
    updated:true
  }
  console.log(object)
  return object

}


function writeNewUserFirebase(uid,object){

    return new Promise((resolve,reject) => {
        var path = "/Users/" + uid
        path = path.toString()
        database.ref(path).update(object, function(error) {
        console.log("Uid: " + uid)
      
          if (error) {
            // The write failed...
            console.error('Status: firebse write failed =>', err);
            isLoading = false
            reject(error)
            
          } else {
            // The write was successful...
            console.log("Status: success")
            isLoading = false
            resolve(true)
          }
          
        })
    })
  

}


function restartInstance(){
  process.on("exit", function () {

      require("child_process").spawn(process.argv.shift(), process.argv, {
          cwd: process.cwd(),
          detached : true,
          stdio: "inherit"
      });
      console.log("Restarting instance!!!!!!")

  });
  process.exit();
};


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
server.listen(process.env.PORT || 3006, 
	() => console.log("Server is running..."));