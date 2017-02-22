var express = require('express');
var request = require('request');
var querystring = require('querystring');
require('dotenv').config();

var port = process.env.PORT || 8080;
var redirect_uri = port === 8080? 'http://192.168.1.74:8080/result' : 'https://music-signature.herokuapp.com/result';
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;

var app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  var scope = 'user-library-read';
  res.redirect('https://accounts.spotify.com/authorize/?' +
      querystring.stringify({
        client_id: client_id,
        redirect_uri: redirect_uri,
        response_type: 'code',
        scope: scope,
        //show_dialog: true
      }));
});

app.get('/result', (req, res) => {

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: req.query.code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    res.render('result', {accessToken: body.access_token});
  });
});


app.listen(port, () => console.log('listening on: '+port));