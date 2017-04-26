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

    createCanvas();
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
      userAnalysis.name = data.display_name;
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
  const createCanvas = () => {

    const canvas = document.getElementById("music-signature");
    console.log(canvas);

    const ctx = canvas.getContext('2d');
    

    

    const offset = canvas.width / analyzedSongs.length;
    const cvHeight = canvas.height;

    for (let i = 0; i < analyzedSongs.length; i++)
    {
      const currentSong = analyzedSongs[i];
      const red = Math.round(255 * currentSong.valence);
      const green = Math.round(255 * ((1 - currentSong.valence)/2));
      const blue = Math.round(255 * (1 - currentSong.valence));
      const opacity = 0.3;
      const radius = Math.round(40 * (1 - (currentSong.energy)));
      const x = i * offset;
      const y = cvHeight * currentSong.liveness;

      console.log(currentSong)
      ctx.beginPath();
      ctx.fillStyle = `rgba(${red},${green},${blue},${opacity})`;
      ctx.arc(x,y,radius,0,2*Math.PI);
      ctx.fill();
    }



  const imageDownload = document.getElementById("download-image");
    imageDownload.addEventListener('click', function() {
      this.href = canvas.toDataURL('image/png');
      const nameForDL = userAnalysis.name.replace(' ','-').toLowerCase();
      this.download = `${nameForDL ? nameForDL+'-':''}music-signature.png`;
    });
  }


  //display basic stats
  const displayStats = () => {

      const firstName = userAnalysis.name.substr(0, userAnalysis.name.indexOf(' '));
      document.getElementsByClassName('name')[0].innerText = `Hey${firstName ? ' '+firstName : ''},`;

      let infoElement = document.getElementsByClassName('info');

      infoElement[0].innerText = `Here are some basic stats from your Spotify library:`;
      infoElement[1].innerHTML = `You have <span>${userAnalysis.totalSongs}</span> songs in your library, with a total length of <span>${(songAnalysis.duration_ms/3600000).toFixed(1)}</span> hours.`;

      if (userAnalysis.topTrack && userAnalysis.topArtist)
      {
        if (userAnalysis.topArtist === userAnalysis.topTrack.artist)
        {
          infoElement[2].innerHTML = `Your top artist is <span class="purple">${userAnalysis.topArtist}</span>, and your favourite song by them is <span class="green">${userAnalysis.topTrack.name}</span>.`;
        }
        else
        {
          infoElement[2].innerHTML = `Your top artist is <span class="purple">${userAnalysis.topArtist}</span>, and your favourite song is <span class="green">${userAnalysis.topTrack.name}</span> by <span class="orange">${userAnalysis.topTrack.artist}</span>.`;
        }
      }

      const averageSongLength = songAnalysis.duration_ms / (userAnalysis.totalSongs * 60000);
      const averageMinutes = Math.floor(averageSongLength);
      const averageSeconds = Math.round((averageSongLength % 1) * 60);

      infoElement[3].innerHTML = `The average song in your library has <span>${Math.round(songAnalysis.tempo)}</span> beats per minute, and is <span>${averageMinutes}:${averageSeconds} minutes </span>long.`;

      const happierMusic = songAnalysis.valence > 0.45 ? true : false;
      infoElement[5].innerHTML = `You generally listen to <span class="${happierMusic ? 'orange' : 'blue'}">${happierMusic ?'happier' : 'sadder'}</span> music.`;


      document.getElementById('loader').classList.add('fadeOut');
      document.getElementById('loader').addEventListener("transitionend", (event) => {
        document.getElementById('music-signature').classList.add('fadeIn');
        let infoWrap = document.getElementsByClassName('info-wrap');
        for (let i = 0; i < infoWrap.length; i++) { infoWrap[i].classList.add('fadeIn');}
      }, false);


  }





  getUserLibrary();
}