const express = require('express');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
app.use(cors());

https.createServer({
    cert: fs.readFileSync('./certificates/server.crt'),
    key: fs.readFileSync('./certificates/server.key')
}, app).listen(8000, () => {
    console.log('Proxy https server running on port 8000');
});

// Redirecting register route to api rest server
app.use('/register', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true
}));

// Redirecting login route to api rest server
app.use('/login', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true
}));