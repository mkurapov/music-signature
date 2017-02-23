const generateSignature = (accessToken) => {

  let userSongs = [];
  let listSongIds = [];
  let analyzedSongs = [];
  let songAnalysis = {};
  let userAnalysis = {name:'', topTrack:{}};

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
    createGraph()
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
    let topArtistUrl = `https://api.spotify.com/v1/me/top/artists?limit=1&time_range=long_term`;
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
      getUserTopTrack();
    });
  }

  const getUserTopTrack = () => {
    let topArtistUrl = `https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=long_term`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };

    fetch(topArtistUrl, options).then((response) => {
      return response.json()
    }).then((data) => {
      userAnalysis.topTrack.name = data.items[0].name;
      userAnalysis.topTrack.artist = data.items[0].artists[0].name;
      displayStats();
    });
  }


  //displaying user and song analysis
  const createGraph = () => {

    console.log(songAnalysis);
    var ctx = document.getElementById("music-signature");




    var songData = {
      labels: ["Acousticness", "Danceability", "Energy", "Instrumentalness", "Liveness", "Valence"],
      datasets: [
        {
          label: "Song Analysis",
          backgroundColor: "rgba(147,210,153,0.7)",
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
          legend: {
            labels:{
                fontSize:20,
                fontFamily:'GraphikRegular',
                fontColor:'black',
            }
          },
        scales:{
          // bodyFontSize:40,
          scaleLabel  :{
            fontSize:40,
          }
        }



      },
    });
   // myRadarChart.defaults.global.defaultFontSize = 20

    console.log(myRadarChart);

  }



  const displayStats = () => {

      console.log(userAnalysis);

      document.getElementsByClassName('name')[0].innerText = `Hey${userAnalysis.name ? ' '+userAnalysis.name : null},`;
      document.getElementsByClassName('info')[0].innerText = `Here are your Spotify stats:`;
      document.getElementsByClassName('info')[1].innerHTML = `You have <span>${userAnalysis.totalSongs}</span> songs in your library, with a total length of <span>${songAnalysis.duration_hours.toFixed(1)}</span> hours.`;
      // userAnalysis.topArtist = undefined;
      if (userAnalysis.topTrack && userAnalysis.topArtist)
      {
        if (userAnalysis.topArtist === userAnalysis.topTrack.artist)
        {
          document.getElementsByClassName('info')[2].innerHTML = `Your top artist is <span class="purple">${userAnalysis.topArtist}</span>, and your favourite song by them is <span class="green">${userAnalysis.topTrack.name}</span>.`;
        }
        else
        {
          document.getElementsByClassName('info')[2].innerHTML = `Your top artist is <span class="purple">${userAnalysis.topArtist}</span>, and your favourite song is <span class="green">${userAnalysis.topTrack.name}</span> by <span class="orange">${userAnalysis.topTrack.artist}</span>.`;
        }
      }


      document.getElementsByClassName('info')[3].innerHTML = `The average song in your library has <span>${Math.round(songAnalysis.tempo)}</span> beats per minute.`;

      let happierMusic = songAnalysis.valence > 0.45 ? true : false;
      document.getElementsByClassName('info')[4].innerHTML = `You generally listen to <span class="${happierMusic ? 'orange' : 'blue'}">${happierMusic ?'happier' : 'sadder'}</span> music.`;

    
    


      document.getElementById('loader').classList.add('fadeOut');
      document.getElementById('loader').addEventListener("transitionend", (event) => {
        document.getElementById('music-signature').classList.add('fadeIn');
        let infoWrap = document.getElementsByClassName('info-wrap');
        for (let i = 0; i < infoWrap.length; i++) { infoWrap[i].classList.add('fadeIn');}
      }, false);
  }


  getUserLibrary();


}