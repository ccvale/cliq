const express = require('express');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketIo = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
    const app = express();
    const server = createServer(app);
    const io = socketIo(server);

    io.on('connection', socket => {
        console.log('New client connected: ', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        socket.on('sendMessage', message => {
            //console.log('sendMessage', message);
            io.emit('receiveMessage', message);
        });
    });

    app.all('*', (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});