const express = require("express")
const request = require('request')
const http = require('http');
var admin = require('firebase-admin')
var serviceAccount = require("./servicekey.json");
const app = express()
var url = "https://esustain.herokuapp.com/newuser?uid=1&latitude=30.3752&longitude=76.7821"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://forest-59f3b-default-rtdb.firebaseio.com"
});

var database = admin.database()

// use the express-static middleware
app.use(express.static("public"))
const server = http.Server(app);

var  i=0;

while(i<200){

    request(url, { json: true }, (err, res, body) => {
    
        if (err) {
        console.error('fetch failed:', err);
        }
        console.error(body)
      })
    i--;

}


