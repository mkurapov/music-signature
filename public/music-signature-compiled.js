'use strict';

var generateSignature = function generateSignature(accessToken) {

  var userSongs = [];
  var totalSongs = 0;
  var listSongIds = [];
  var analyzedSongs = [];
  var songAnalysis = {};

  var getUserLibrary = function getUserLibrary() {
    var songOffset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;


    var url = 'https://api.spotify.com/v1/me/tracks?limit=50&offset=' + songOffset;
    var options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(url, options).then(function (response) {
      return response.json();
    }).then(function (data) {

      totalSongs = data.total;
      userSongs = userSongs.concat(data.items);

      if (userSongs.length < totalSongs) {
        getUserLibrary(songOffset += 50);
      } else {
        for (var i = 0; i < totalSongs; i++) {
          listSongIds.push(userSongs[i].track.id);
        }
        getAudioFeatures();
      }
    });
  };

  var getAudioFeatures = function getAudioFeatures() {

    var songIdsToGrab = listSongIds.slice(0, 100);

    var url = 'https://api.spotify.com/v1/audio-features?ids=' + songIdsToGrab.toString();
    var options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(url, options).then(function (response) {
      return response.json();
    }).then(function (data) {
      analyzedSongs = analyzedSongs.concat(data.audio_features);

      if (analyzedSongs.length < totalSongs) {
        listSongIds.splice(0, 100);
        getAudioFeatures();
      } else {
        calculateAverages();
      }
    });
  };

  var calculateAverages = function calculateAverages() {
    //songAnalysis contains average of all analyzedSongs properties
    songAnalysis = analyzedSongs.reduce(function (acc, song, index) {
      for (var key in acc) {
        if (typeof acc[key] === 'number') {
          acc[key] += song[key];
        } else {
          acc[key] = null;
        }
      }
      return acc;
    });

    for (var key in songAnalysis) {
      if (typeof songAnalysis[key] === 'number') {
        key === 'duration_ms' ? null : songAnalysis[key] /= totalSongs;
      }
    }

    songAnalysis.duration_hours = songAnalysis.duration_ms / 3600000;
    console.log(songAnalysis);
    displayData();
  };

  var displayData = function displayData() {
    var ctx = document.getElementById("music-signature");

    document.getElementById('loader').classList.add('fadeOut');
    document.getElementById('loader').addEventListener("transitionend", function (event) {
      ctx.classList.add('fadeIn');
    }, false);

    var songData = {
      labels: ["Acousticness", "Danceability", "Energy", "Instrumentalness", "Liveness", "Valence"],
      datasets: [{
        label: "Song Analysis",
        backgroundColor: "rgba(147,210,153,0.5)",
        borderColor: "rgba(179,181,198,1)",
        pointBackgroundColor: "rgba(179,181,198,1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(179,181,198,1)",
        data: [songAnalysis.acousticness, songAnalysis.danceability, songAnalysis.energy, songAnalysis.instrumentalness, songAnalysis.liveness, songAnalysis.valence]
      }]
    };

    var myRadarChart = new Chart(ctx, {
      type: 'radar',
      data: songData,
      options: {
        //            maintainAspectRatio: false
      }
    });
  };

  getUserLibrary();
};
