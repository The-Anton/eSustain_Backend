var forestDataUrl = "https://api.data.gov.in/resource/4b573150-4b0e-4a38-9f4b-ae643de88f09?api-key=579b464db66ec23bdd00000157bc862d9f2146d84b764d388c4b7319&format=json&filters[states_uts]="


exports.fetchForestData = (state, callback) => {

  forestDataUrl += state;
  request(forestDataUrl, { json: true }, (err, res, body) => {

    //console(console.log(err))
    if (err) {
      return console.error('fetch failed:', err);
    }
    var forest = body.records[0];
    callback(forest);
  });

}

