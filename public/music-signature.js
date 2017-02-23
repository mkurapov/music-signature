const generateSignature = (accessToken) => {

  let userSongs = [];
  let listSongIds = [];
  let analyzedSongs = [];
  let songAnalysis = {};
  let userAnalysis = {};

  const getUserLibrary = (songOffset = 0) => {

    let url = `https://api.spotify.com/v1/me/tracks?limit=50&offset=${songOffset}`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(url, options).then((response) => {
      return response.json()
    }).then((data) => {

      userAnalysis.totalSongs = data.total;
      userSongs = userSongs.concat(data.items)

      if (userSongs.length < userAnalysis.totalSongs) {
        getUserLibrary(songOffset += 50);
      }
      else {
        for (let i = 0; i < userAnalysis.totalSongs; i++) {
          listSongIds.push(userSongs[i].track.id);
        }
        getAudioFeatures();
      }
    });
  }


  const getAudioFeatures = () => {

    const songIdsToGrab = listSongIds.slice(0, 100);

    let url = `https://api.spotify.com/v1/audio-features?ids=${songIdsToGrab.toString()}`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(url, options).then((response) => {
      return response.json()
    }).then((data) => {
      analyzedSongs = analyzedSongs.concat(data.audio_features);

      if (analyzedSongs.length < userAnalysis.totalSongs) {
        listSongIds.splice(0, 100);
        getAudioFeatures();
      }
      else {
        calculateAverages()
      }
    });
  };

  const calculateAverages = () => {
    //songAnalysis contains average of all analyzedSongs properties
    songAnalysis = analyzedSongs.reduce((acc, song, index) => {
      for (const key in acc) {
        if (typeof acc[key] === 'number') {
          acc[key] += song[key];
        }
        else {
          acc[key] = null;
        }
      }
      return acc;
    });

    for (const key in songAnalysis) {
      if (typeof songAnalysis[key] === 'number') {
        (key === 'duration_ms') ? null : songAnalysis[key] /= userAnalysis.totalSongs;
      }
    }

    songAnalysis.duration_hours = songAnalysis.duration_ms / 3600000;
    displaySongAnalysis()
    getUserStats();

  }

  //grabbing user specific information
  const getUserStats = () => {
    let url = `https://api.spotify.com/v1/me`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(url, options).then((response) => {
      return response.json()
    }).then((data) => {
      userAnalysis.name = data.display_name.substr(0, data.display_name.indexOf(' '));
      getUserTopArtist();
    });
  }

  const getUserTopArtist = () => {
    let topArtistUrl = `https://api.spotify.com/v1/me/top/artists`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(topArtistUrl, options).then((response) => {
      return response.json()
    }).then((data) => {
      userAnalysis.topArtist = data.items[0].name;
      displayUser();
    });
  }


  //displaying user and song analysis
  const displaySongAnalysis = () => {

    console.log(songAnalysis);
    var ctx = document.getElementById("music-signature");

    document.getElementById('loader').classList.add('fadeOut');
    document.getElementById('loader').addEventListener("transitionend", (event) => {
      ctx.classList.add('fadeIn');
    }, false);


    var songData = {
      labels: ["Acousticness", "Danceability", "Energy", "Instrumentalness", "Liveness", "Valence"],
      datasets: [
        {
          label: "Song Analysis",
          backgroundColor: "rgba(147,210,153,0.5)",
          borderColor: "rgba(179,181,198,1)",
          pointBackgroundColor: "rgba(179,181,198,1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(179,181,198,1)",
          data: [songAnalysis.acousticness, songAnalysis.danceability, songAnalysis.energy, songAnalysis.instrumentalness, songAnalysis.liveness, songAnalysis.valence]
        }
      ]
    };

    var myRadarChart = new Chart(ctx, {
      type: 'radar',
      data: songData,
      options: {
        //            maintainAspectRatio: false
      }
    });

  }



  const displayUser = () => {

    console.log(userAnalysis);
      document.getElementsByClassName('name')[0].innerText = `Hey${userAnalysis.name ? ' '+userAnalysis.name : null},`;
      document.getElementsByClassName('info')[0].innerText = `Here are your Spotify stats:`;
      document.getElementsByClassName('info')[1].innerHTML = `You have <span>${userAnalysis.totalSongs}</span> songs in your library, with a total length of <span>${songAnalysis.duration_hours.toFixed(1)}</span> hours.`;
      (userAnalysis.topArtist) ? document.getElementsByClassName('info')[2].innerHTML = `Your most popular artist is <span>${userAnalysis.topArtist}</span>.` : null;


  }


  getUserLibrary();


}