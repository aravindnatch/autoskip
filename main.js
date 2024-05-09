const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const refreshToken = process.env.refresh_token;
const clientId = process.env.client_id;
const clientSecret = process.env.client_secret;

// The array of track IDs you want to skip
const skipTrackIds = [
  '7fzHQizxTqy8wTXwlrgPQQ', 
  '3Sz8P5ZFLARe2oJeb0qsyb', 
  '0RBw4ODUQPO4cuAOZtBGga'
];

let accessToken;

async function refreshAccessToken() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      }
    });

    accessToken = response.data.access_token;
    setTimeout(refreshAccessToken, response.data.expires_in * 1000 - 60000);
  } catch (error) {
    console.error('Failed to refresh token:', error);
    setTimeout(refreshAccessToken, 60000);
  }
}

async function getCurrentPlayingTrack() {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    return response.data?.item?.id;
  } catch (error) {
    console.error('Error fetching current playing track:', error);
    return null;
  }
}

async function skipTrack() {
  await axios.post('https://api.spotify.com/v1/me/player/next', {}, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
}

async function main() {
  await refreshAccessToken();

  async function loop() {
    try {
      const currentTrackId = await getCurrentPlayingTrack();
  
      if (skipTrackIds.includes(currentTrackId)) {
        console.log(`Skipping track: ${currentTrackId}`);
        await skipTrack();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error in main loop:', error);
    } finally {
      setTimeout(loop, 500);
    }
  }

  loop();
}

main();
