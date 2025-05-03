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
  ctx.reply('Welcome to the TMDb Poster Bot!\n\nUse /poster MovieName in groups to get the landscape poster of a movie.');
});

// /poster command (group only)
bot.command('poster', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('❌ The /poster command only works in groups.');
  }

  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('Please provide a movie name. Example: /poster Jawan');

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl);

    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      return ctx.reply('Movie not found.');
    }

    const movie = searchRes.data.results[0];
    const movieId = movie.id;

    const imageUrl = `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${TMDB_API_KEY}`;
    const imageRes = await axios.get(imageUrl);

    const backdrops = imageRes.data.backdrops;
    if (!backdrops || backdrops.length === 0) {
      return ctx.reply('No landscape poster found.');
    }

    const backdropPath = backdrops[0].file_path;
    const fullImageUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;

    await ctx.replyWithPhoto({ url: fullImageUrl }, { caption: movie.title });

  } catch (error) {
    console.error(error.message);
    ctx.reply('Error fetching poster.');
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
