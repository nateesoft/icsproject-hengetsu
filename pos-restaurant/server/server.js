require("dotenv").config()

const express = require('express');
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require('path');
const app = express();

const BASENAME = "/pos-restaurant";

app.use(BASENAME, express.static(path.join(__dirname, process.env.WEB_FOLDER)));

app.use(`/api`, createProxyMiddleware({
      target: process.env.SERVICE_HOST,
      changeOrigin: true,
    })
  );

app.use((req, res, next) => {
    if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
        next();
    } else {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        res.sendFile(path.join(__dirname, process.env.WEB_FOLDER, 'index.html'));
    }
});

// Serve React frontend for any unknown routes
app.get(`${BASENAME}/*`, (req, res) => {
    res.sendFile(express.static(path.join(__dirname, process.env.WEB_FOLDER)));
  });
  

const port = process.env.WEB_PORT || 3000
console.log(`Website running port ${port}`)

app.listen(port);
