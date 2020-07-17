require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const scope = 'user-library-read';

const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
};

app.get('/', (req, res) => {
  console.log('Waiting for user login...');
  res.redirect(
    `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&show_dialog=true`
  );
});

app.get('/callback', async (req, res) => {
  const body = {
    grant_type: 'authorization_code',
    code: req.query.code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  };
  console.log(
    `Login success!\nAuthorization code: ${req.query.code}\nSeding request for access token & refresh token...`
  );
  const authData = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: encodeFormData(body),
  }).then((resp) => resp.json());
  const accessToken = authData.access_token;
  const refreshToken = authData.refresh_token;
  console.log(
    `Access token: ${accessToken}\nRefresh token: ${refreshToken}\nGetting user's liked songs using the access token...`
  );
  const likedSongs = await fetch('https://api.spotify.com/v1/me/tracks', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((resp) => resp.json())
    .then((data) => data.items);
  console.log(`User has liked ${likedSongs.length} songs:`);
  likedSongs.forEach((song) => {
    console.log(`${song.track.name} - ${song.track.artists[0].name}`);
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`App started on ${PORT}.`);
});
