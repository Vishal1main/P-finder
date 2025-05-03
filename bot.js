const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

// ---- HARDCODED VARIABLES ----
const BOT_TOKEN = '7524267790:AAFPFDCaTZgEZEHcaiKNxL-bEQSi43B3v_s';
const TMDB_API_KEY = '4b6e108d2d340e1c4da27a739feaf820';
const PORT = 3000;
// -----------------------------

const bot = new Telegraf(BOT_TOKEN);

// /start message
bot.start((ctx) => {
  ctx.reply('Welcome to the TMDb Poster Bot!\n\nUse /poster MovieName in groups to get multiple posters.');
});

// /poster command (group only)
bot.command('poster', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('❌ The /poster command only works in groups.');
  }

  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('Please provide a movie name. Example: /poster Jawan');

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl);
    const result = searchRes.data.results[0];

    if (!result) return ctx.reply('Movie/TV Show not found.');

    const isTV = result.media_type === 'tv';
    const title = isTV ? result.name : result.title;
    const year = (result.first_air_date || result.release_date || '').split('-')[0];
    const tmdbType = isTV ? 'Tv' : 'Movie';
    const genresUrl = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${result.id}?api_key=${TMDB_API_KEY}`;
    const genresRes = await axios.get(genresUrl);
    const genres = genresRes.data.genres.map(g => g.name).join(', ') || 'N/A';

    const imagesUrl = `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${result.id}/images?api_key=${TMDB_API_KEY}`;
    const imagesRes = await axios.get(imagesUrl);

    const base = 'https://image.tmdb.org/t/p/original';

    // Backdrops (landscape)
    const backdrops = imagesRes.data.backdrops || [];
    const rawLandscapes = backdrops.slice(0, 5); // All languages
    const hindiLandscapes = backdrops.filter(b => b.iso_639_1 === 'hi').slice(0, 5);

    // Posters (portrait)
    const posters = imagesRes.data.posters || [];
    const portraitPosters = posters.filter(p => p.iso_639_1 !== null).slice(0, 5);

    // Format HTML message
    let message = `🎬 <b>${title}</b> (${year})\n`;
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

  } catch (error) {
    console.error(error.message);
    ctx.reply('Error fetching posters.');
  }
});

// Launch bot
bot.launch();
console.log('Bot is running...');

// Dummy web server for Render
const app = express();
app.get('/', (req, res) => {
  res.send('TMDb Poster Bot is running.');
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
