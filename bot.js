const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { createReadStream } = require('fs');
const { createWriteStream } = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { Readable } = require('stream');
const fetch = require('node-fetch');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const { v4: uuidv4 } = require('uuid');

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const app = express();
const port = process.env.PORT || 3000;

const mongodbUrl = process.env.MONGODB_URL;

const downloadFolder = './downloads';
const streamFolder = './stream';

if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

if (!fs.existsSync(streamFolder)) {
  fs.mkdirSync(streamFolder);
}

const downloadLinks = {};
const streamLinks = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('The bot is running!');
});

app.get('/download/:id', (req, res) => {
  const id = req.params.id;
  const file = downloadLinks[id];

  if (file) {
    res.setHeader('Content-disposition', 'attachment; filename=' + file.name);
    createReadStream(file.path).pipe(res);
  } else {
    res.send('Invalid download link.');
  }
});

app.get('/stream/:id', (req, res) => {
  const id = req.params.id;
  const file = streamLinks[id];

  if (file) {
    const streamPath = path.join(streamFolder, id + '.m3u8');
    const streamFile = fs.createReadStream(streamPath);
    streamFile.pipe(res);
  } else {
    res.send('Invalid stream link.');
  }
});

bot.on('message', async (msg) => {
  if (msg.chat.type === 'private' && msg.document) {
    try {
      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const fileName = msg.document.file_name;
      const fileSize = msg.document.file_size;

      const downloadId = uuidv4();
      const downloadLink = `${process.env.APP_URL}/download/${downloadId}`;
      downloadLinks[downloadId] = { path: path.join(downloadFolder, fileName), name: fileName };
      const downloadButton = {
        text: '⚡DOWLOAD⚡',
        url: downloadLink,
      };

      const streamId = uuidv4();
      const streamLink = `${process.env.APP_URL}/stream/${streamId}`;
      streamLinks[streamId] = { path: path.join(streamFolder, streamId + '.m3u8') };
      const streamButton = {
        text: '⚡WATCH⚡',
        url: streamLink,
      };

      await bot.sendMessage(msg.chat.id, `File Name: ${fileName}\n\n📦File Size: ${fileSize}\n💌Download link: ${downloadLink}\n💻Watch online: ${streamLink}\n\n♻️ THIS LINK IS PERMANENT AND WILL NOT EXPIRE ♻️`, {
        reply_markup: {
          inline_keyboard: [[downloadButton, streamButton]],
        },
        parse_mode: 'HTML',
      });

      const downloadPath = path.join(downloadFolder, fileName);
      await bot.downloadFile(fileId, downloadPath);

      await new Promise((resolve, reject) => {
        ffmpeg(createReadStream(downloadPath))
          .outputOptions([
            '-profile:v baseline',
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
          ])
          .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
            reject(err);
          })
          .on('end', async () => {
            console.log('Processing finished!');
            await rimraf(downloadPath);
            resolve();
          })
          .pipe(createWriteStream(path.join(streamFolder, streamId + '.m3u8')));
      });

      const netlifyWebhookUrl = process.env.NETLIFY_WEBHOOK_URL;
      if (netlifyWebhookUrl) {
        const webhookResponse = await fetch(netlifyWebhookUrl);
        console.log('Netlify Webhook Response:', webhookResponse.status, webhookResponse.statusText);
      }
    } catch (err) {
      console.log('An error occurred: ' + err.message);
      await bot.sendMessage(msg.chat.id, 'An error occurred. Please try again later.');
    }
  }
});

app.listen(port, () => {
  console.log(`Bot is listening at http://localhost:${port}`);
});
