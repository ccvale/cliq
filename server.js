const express = require('express');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketIo = require('socket.io');

/*

The server.js file is the entry point for the server side of the application.
It creates an express server, and a socket.io server.
It then sets up the socket.io server to listen for connections and disconnections.
This is key to the real-time functionality of the messaging aspect of the application.

It also sets up the socket.io server to listen for the sendMessage event and emit the receiveMessage events, which act as follows:
    - sendMessage: When a client sends a message, the server receives the message and emits a receiveMessage event to the user on the other end.
    - receiveMessage: When a client receives a message from another user, the client displays the message in the chat window as soon as it's sent.
    
*/

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

        socket.on('userUnmatched', (userA, userB) => {
            //console.log('userUnmatched', userA, userB);
            //io.emit('userUnmatched', userA, userB);

        })

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