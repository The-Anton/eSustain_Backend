const express = require("express")
const request = require('request')
const http = require('http');
var admin = require('firebase-admin')
var serviceAccount = require("./servicekey.json");
const { resolve } = require("path");
const e = require("express");
const app = express()
var revGeoCodingUrl = "https://us1.locationiq.com/v1/reverse.php?key=pk.6500b602741f3cbdb1214e8fb297041a&format=json&"
var airDataUrl = "https://api.weatherbit.io/v2.0/current/airquality?key=c046a9b2852c4831bce898a3d0065d14&"


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

app.get("/newuser", function (req, res) {

  const uid = req.param("uid")
  const latitude = req.param("latitude")
  const longitude = req.param("longitude")
  
  createUserData(uid,latitude,longitude,res)
   
})


async function createUserData(uid,latitude,longitude,res){

    try{

        var p1 = await firstParallel(latitude,longitude,res)
    
        var addressData = p1[0]
        var airData = p1[1]
        var state = addressData.state.toLowerCase()
        var district
        if(addressData.state_district!= undefined){
            district = parseDistrict(addressData.state_district.toLowerCase())

        }else{
            district = parseDistrict(addressData.city.toLowerCase())

        }
        var city = parseDistrict(district)
        var p2 = await secondParallel(state,city)
        
        var forestData = p2[0]
        var groundwaterData = p2[1]
        var finalData = initiateParams(latitude,longitude,district,addressData,airData,forestData,groundwaterData)
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


async function firstParallel(latitude,longitude,mainres){

    const p1 = new Promise((resolve,reject) => {

        revGeoCodingUrl += "lat="+latitude + "&lon=" + longitude

        request(revGeoCodingUrl, { json: true }, (err, res, body) => {
        
            if (err) {
                console.log(err)
                reject(err)
            }else{
                var address = body.address
                if(address.country != "India"){

                    var temp = nullResponse
                    temp["apistatus"] = true
                    temp["country"] = "invalid"
                    mainres.send(temp)
                    restartInstance()
                }
                resolve(address)
            }
            
        })
  
  })




    const p2 = new Promise((resolve, reject) => {
        airDataUrl+= "lat="+latitude + "&lon=" + longitude

        request(airDataUrl, { json: true }, (err, res, body) => {
            if (err) {
                console.log(err)
                reject(err)
            }else{
                var air = body.data[0]
                //console.log(air)
                resolve(air)
            }
            
        })
    })


    return await Promise.all([p1,p2])
    
}

async function secondParallel(state,district){

    const c1 = new Promise((resolve,reject) =>{
        state = state.toLowerCase()
        var ref = database.ref(`stateForestData/${state}`);
      
        ref.on("value", function(snapshot) {
          var forestObject = {"geo":snapshot.val().geoarea,"nf":snapshot.val().noforest,"af":snapshot.val().actualforestcover,"of":snapshot.val().openforest}
          resolve(forestObject)
        }, function (errorObject) {
          var forestObject = {"geo":0,"nf":0,"af":0,"of":0}
          resolve(forestObject)
        });
    
        if(0){
          reject("error occoured")
        }
      })
      

       const c2 = new Promise((resolve,reject)=>{
        state = state.toLowerCase()
        district = district.toLowerCase()
        const cityRef = dbfirestore.collection('groundWaterData').doc(`/india/${state}/${district}`);
       
           (async () => {
            doc =  await cityRef.get();
            if (!doc.exists) {
                var list = ['0','0','0','0','0','0','0','0','0','0','0','0','0']
              var result = {"list":list,"stage":50}
                resolve(result)
            } else {
                var list = [ doc.data().annual_allocation_domestic_2025.toString(),
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
                  doc.data().total_natural_discharges.toString() ]

            var result = {"list":list,"stage":doc.data().stage}
                resolve(result)
            }

            if(0){
              reject("error occoured")
            }
          })();
         
    })


    return await Promise.all([c1,c2])
    
}




function initiateParams(latitude, longitude,district, addressData,airData,forestData,groundwater){


  var aqi = airData.aqi
  var openForest = 0
  var totalArea = 0
  var noForest = 0
  var actualForest = 0
  var forestDensity = 0
  var normalizedScore = 1000 - ((aqi*50))/(10*10)
  
 if(groundwater.list[1]=='0' && forestData.geo > 0  ){

    openForest = parseInt(forestData.of)
    totalArea = parseInt(forestData.geo)
    forestDensity = (openForest/totalArea)*100
    normalizedScore = 1000 - ((aqi*50))/(forestDensity*10)
    noForest = parseInt(forestData.nf);
    actualForest = parseInt(forestData.af);

  }else if(groundwater.list[1]!='0' && forestData.geo == 0  ){

    normalizedScore = 1000 - ((aqi*groundwater.stage))/(10*10)
    
  }else{

    openForest = parseInt(forestData.of)
    totalArea = parseInt(forestData.geo)
    forestDensity = (openForest/totalArea)*100
    normalizedScore = 1000 - ((aqi*groundwater.stage))/(forestDensity*10)
    noForest = parseInt(forestData.nf)
    actualForest = parseInt(forestData.af)

  }
 

  if(normalizedScore >500){
    recommendedTarget = 4
  }else{
    recommendedTarget = Math.ceil(((1000-normalizedScore)/100))
  }

  var groundWaterData = groundwater.list

  var locationObj = {'0':latitude.toString(), '1':longitude.toString()}

  return {
    'normalizedScore':normalizedScore,'aqi':airData.aqi,'co':airData.co,'no2':airData.no2,
    'o3':airData.o3,'location':locationObj,'pm10':airData.pm10,'pm25':airData.pm25,'so2':airData.so2,'recommendedTarget' :recommendedTarget,
    'forestDensity':forestDensity,'totalArea':totalArea,'noForest':noForest,'openForest':openForest,'actualForest':actualForest,
    'city':district,'state':addressData.state.toString(),'apistatus':true,'groundWaterData':groundWaterData,'country':addressData.country.toString(),
    updated:true
  }

}


function writeNewUserFirebase(uid,object){

    return new Promise((resolve,reject) => {
        var path = "/Users/" + uid
        path = path.toString()
        database.ref(path).update(object, function(error) {
        console.log("Uid: " + uid)
            
      
          if (error) {
            // The write failed...
            console.error('Status: firebase write failed =>', err);
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

function updateKeysCount(key,tag){

}



function parseDistrict(district){
    var commanLetters = ["the", "district"]
    var list = district.trim().split(" ")

    if(list.length == 1){
        return list[0]
    }else{
        for(var i=0; i<list.length; i++){
            if(commanLetters.includes(list[i])){
                list.splice(i,1)
            }
        }
        var s =""
        for(var i=0; i<list.length; i++){
            s =s + " " + list[i]
        }
        console.log(s)
        return s.trim()
    }
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



app.get("/keepalive", function (req, res) {

    console.log("I'm alive")
    res.send("I'm alive")
    restartInstance()
  })

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