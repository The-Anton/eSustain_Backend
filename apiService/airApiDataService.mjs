var airDataUrl = "https://api.weatherbit.io/v2.0/current/airquality?key=fe3cc9eeea474df0af9999424550bdee&"



exports.fetchAirData = (latitude, longitude, callback) => {

  airDataUrl += "lat=" + latitude + "&lon=" + longitude;

  request(airDataUrl, { json: true }, (err, res, body) => {
    //console(console.log(err))
    if (err) {
      return console.error('fetch failed:', err);
    }
    var air = body.data[0];
    callback(air);
  });

}
  