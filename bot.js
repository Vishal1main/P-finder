const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

// Replace these with your own keys
const BOT_TOKEN = '7524267790:AAFPFDCaTZgEZEHcaiKNxL-bEQSi43B3v_s';
const TMDB_API_KEY = '4b6e108d2d340e1c4da27a739feaf820';
const PORT = 3000;

const bot = new Telegraf(BOT_TOKEN);

// Welcome message
bot.start((ctx) => {
  ctx.reply('Welcome to the TMDb Poster Bot!\n\nUse /poster MovieName in groups to get multiple posters.');
});

// /poster command
bot.command('poster', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('❌ The /poster command only works in groups.');
  }

  const queryText = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!queryText) return ctx.reply('Please provide a movie name. Example: /poster Jawan 2023');

  // Extract title and year if provided
  const match = queryText.match(/(.*?)(?:\s+(\d{4}))?$/);
  const query = match[1].trim();
  const year = match[2] || '';

  try {
    // Search TMDb
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl);
    const results = searchRes.data.results || [];

    // Filter valid results
    const filtered = results.find(r => {
      const title = r.title || r.name || '';
      const release = r.release_date || r.first_air_date || '';
      const resultYear = release.split('-')[0];
      const hasImage = r.poster_path || r.backdrop_path;
      return hasImage && (!year || resultYear === year);
    });

    if (!filtered) return ctx.reply('Movie/TV Show not found or posters unavailable.');

    const isTV = filtered.media_type === 'tv';
    const title = isTV ? filtered.name : filtered.title;
    const resultYear = (filtered.first_air_date || filtered.release_date || '').split('-')[0];
    const tmdbType = isTV ? 'Tv' : 'Movie';

    // Get genre info
    const genreUrl = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${filtered.id}?api_key=${TMDB_API_KEY}`;
    const genreRes = await axios.get(genreUrl);
    const genres = genreRes.data.genres.map(g => g.name).join(', ') || 'N/A';

    // Get images
    const imageUrl = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${filtered.id}/images?api_key=${TMDB_API_KEY}`;
    const imagesRes = await axios.get(imageUrl);
    const base = 'https://image.tmdb.org/t/p/original';

    const backdrops = imagesRes.data.backdrops || [];
    const posters = imagesRes.data.posters || [];

    const rawLandscapes = backdrops.slice(0, 5);
    const hindiLandscapes = backdrops.filter(b => b.iso_639_1 === 'hi').slice(0, 5);
    const portraitPosters = posters.filter(p => p.iso_639_1 !== null).slice(0, 5);

    // Format HTML message
    let message = `🎬 <b>${title}</b> (${resultYear})\n`;
    message += `🔍 <b>Type:</b> ${tmdbType}\n`;
    message += `🎭 <b>Genres:</b> ${genres}\n`;

    if (rawLandscapes.length) {
      message += `\n📥 <b>Available Posters</b>\n🏷 <b>Raw Landscape</b>\n`;
      rawLandscapes.forEach((b, i) => {
        message += `${i + 1}. <a href="${base}${b.file_path}">Click Here</a>\n`;
      });
    }

    if (hindiLandscapes.length) {
      message += `\n⛅ <b>Landscape Posters (Hindi)</b>\n`;
      hindiLandscapes.forEach((b, i) => {
        message += `${i + 1}. <a href="${base}${b.file_path}">Click Here</a>\n`;
      });
    }

    if (portraitPosters.length) {
      message += `\n🖼️ <b>Portrait Posters</b>\n`;
      portraitPosters.forEach((p, i) => {
        message += `${i + 1}. <a href="${base}${p.file_path}">Click Here</a>\n`;
      });
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error(err.message);
    ctx.reply('Error while fetching poster. Try again.');
  }
});

// Launch bot
bot.launch();
console.log('Bot is running...');

// Express server for Render
const app = express();
app.get('/', (req, res) => {
  res.send('TMDb Poster Bot is running.');
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
