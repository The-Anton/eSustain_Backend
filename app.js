// create an express app
const express = require("express")
const request = require('request');
const app = express()

const DEMO_KEY = "h27fdmxssx2dxlp369n6ncdc7ach1wui"
// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/", function (req, res) {
    request('http://apis.mapmyindia.com/advancedmaps/v1/h27fdmxssx2dxlp369n6ncdc7ach1wui/rev_geocode?lat=30.3752&lng=76.7821', { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      //console.log(res);
      console.log(body);
     // res.send("<h1>Hello World! + ${body.url} + ${body.explanation}</h1>")

    });
})




// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));