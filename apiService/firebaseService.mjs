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

exports.writeNewUserFirebase = (uid,object,callback) => {

    var path = "/Users/" + uid
  
    database.ref(path).update(object, function(error) {
      console.log("Uid: " + uid)
  
      if (error) {
        // The write failed...
        console.error('firebse write failed:', err)
          return res.send(nullResponse)
        
      } else {
        // The write was successful...
        console.log("success")
        callback(true)
      }
      
    })
  
  }


