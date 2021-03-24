var revGeoCodingUrl = "http://apis.mapmyindia.com/advancedmaps/v1/pi3yb3qxy8obnmsrjwh9lm4gghx7xvwm/rev_geocode?"
var revGeoCodingUrl2 = "https://us1.locationiq.com/v1/reverse.php?key=pk.6500b602741f3cbdb1214e8fb297041a&format=json&"



exports.fetchAddressData = (latitude, longitude, callback) => {

  revGeoCodingUrl += "lat=" + latitude + "&lng=" + longitude

  request(revGeoCodingUrl, { json: true }, (err, res, body) => {

    //callback(console.log(err))
    if (err) {
      return console.error('fetch failed:', err)
    }
    var address = body.results[0]
    callback(address)
  })

}
  


exports.fetchAddressData2 = (latitude, longitude, callback) => {

  revGeoCodingUrl2 += "lat=" + latitude + "&lon=" + longitude

  request(revGeoCodingUrl2, { json: true }, (err, res, body) => {

    //callback(console.log(err))
    if (err) {
      return console.error('fetch failed:', err)
    }
    var address = body.address
    callback(address)
  })

}


