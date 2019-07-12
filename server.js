/* server.js */
const cors = require('cors');
const next = require('next');
const Pusher = require('pusher');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const Sentiment = require('sentiment');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handler = app.getRequestHandler();
const sentiment = new Sentiment();

// Убедитесь, что ваши учётные данные правильно установлены в файле .env
// Используем определённые переменные
const pusher = new Pusher({
    appId: '821993',
    key: '3271901cd16c29d89388',
    secret: '43596d909ecc198f2f65',
    cluster: 'eu',
    encrypted: true
});

app.prepare()
  .then(() => {
 
    const server = express();
   
    server.use(cors());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
   
    server.get('*', (req, res) => {
        return handler(req, res);
    });
   
    const chatHistory = { messages: [] };
  
    server.post('/message', (req, res, next) => {
        const { user = null, message = '', timestamp = +new Date } = req.body;
        const sentimentScore = sentiment.analyze(message).score;
        
        const chat = { user, message, timestamp, sentiment: sentimentScore };
        
        chatHistory.messages.push(chat);
        pusher.trigger('chat-room', 'new-message', { chat });
    });
  
    server.post('/messages', (req, res, next) => {
        res.json({ ...chatHistory, status: 'success' });
    });

    server.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
   
  })
  .catch(ex => {
        console.error(ex.stack);
        process.exit(1);
  });