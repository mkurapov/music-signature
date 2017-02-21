var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');

var keys = require('./keys');
var port = process.env.PORT || 8080;
var redirect_uri = port === 8080? 'http://192.168.1.74:8080/' : 'https://music-signature.herokuapp.com/'; //dev : prod

var app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {


  const code = req.query.code;

  if (code) {

    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(keys.clientID + ':' + keys.clientSecret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      res.render('index', {accessToken: body.access_token});
    });
  }
  else
  {
    var scope = 'user-library-read';
    res.redirect('https://accounts.spotify.com/authorize/?' +
        querystring.stringify({
          client_id: keys.clientID,
          redirect_uri: redirect_uri,
          response_type: 'code',
          scope: scope,
          show_dialog: true
        }));
  }



});


app.listen(port, () => console.log('listening on: '+port));