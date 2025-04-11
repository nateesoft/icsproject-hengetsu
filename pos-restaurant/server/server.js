require("dotenv").config()

const express = require('express');
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require('path');
const app = express();

const BASENAME = "/pos-restaurant";

app.use(BASENAME, express.static(path.join(__dirname, process.env.WEB_FOLDER)));

app.use(`/api`, createProxyMiddleware({ 
  target: process.env.SERVICE_HOST, changeOrigin: true 
}));

app.get(`${BASENAME}/config.json`, (req, res) => {
  res.json({
    SOCKET_HOST: process.env.SOCKET_HOST,
    MACNO: process.env.MACNO
  });
});

app.use((req, res, next) => {
    if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
        next();
    } else {
        res.cookie('MACNO', process.env.MACNO, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000
        });
        res.cookie('SOCKET_HOST', process.env.SOCKET_HOST, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000
        });

        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        res.sendFile(path.join(__dirname, process.env.WEB_FOLDER, 'index.html'));
    }
});

// Serve React frontend for any unknown routes
app.get(`${BASENAME}/*`, (req, res) => {
  res.cookie('MACNO', process.env.MACNO, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000
  });
  res.cookie('SOCKET_HOST', process.env.SOCKET_HOST, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000
  });
  
  res.sendFile(express.static(path.join(__dirname, process.env.WEB_FOLDER)));
});
  

const port = process.env.WEB_PORT || 3000
console.log(`Website running port ${port}`)

app.listen(port);
