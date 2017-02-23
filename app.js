var express = require('express');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
require('dotenv').config();

var port = process.env.PORT || 8080;
var redirect_uri = port === 8080? 'http://192.168.1.74:8080/result' : 'https://music-signature.herokuapp.com/result';
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var stateKey = 'spotify_auth_state';

var app = express();

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {

  var state = generateRandomString(16);
  res.cookie('stateKey', state);

  var scope = 'user-library-read user-top-read';
  res.redirect('https://accounts.spotify.com/authorize/?' +
      querystring.stringify({
        client_id: client_id,
        redirect_uri: redirect_uri,
        response_type: 'code',
        scope: scope,
        state: state,
       // show_dialog: true
      }));
});

app.get('/result', (req, res) => {

  const code = req.query.code || null;
  const storedCode = req.cookies.storedCode || null;


  if (storedCode === code)
  {
    res.clearCookie('storedCode');
    res.redirect('/login');
  }
  else {

    res.cookie('storedCode', code);
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {

      const accessToken = body.access_token;
      res.cookie('access_token', accessToken)
      res.render('result', {accessToken: accessToken});
    });
  }
});

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.listen(port, () => console.log('listening on: '+port));