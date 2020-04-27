// -------------------VARIABLES-----------------------

const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
    pingInterval: 10000,
    pingTimeout: (1000 * 60) * 30,
    cookie: false
})
let idNumber = 0
let rooms = []
let hosts = {}
let cards = [
    '2C', '2D', '2H', '2S',
    '3C', '3D', '3H', '3S',
    '4C', '4D', '4H', '4S',
    '5C', '5D', '5H', '5S',
    '6C', '6D', '6H', '6S',
    '7C', '7D', '7H', '7S',
    '8C', '8D', '8H', '8S',
    '9C', '9D', '9H', '9S',
    '10C', '10D', '10H', '10S',
    'JC', 'JD', 'JH', 'JS',
    'QC', 'QD', 'QH', 'QS',
    'KC', 'KD', 'KH', 'KS',
    'AC', 'AD', 'AH', 'AS',
    '2C', '2D', '2H', '2S',
    '3C', '3D', '3H', '3S',
    '4C', '4D', '4H', '4S',
    '5C', '5D', '5H', '5S',
    '6C', '6D', '6H', '6S',
    '7C', '7D', '7H', '7S',
    '8C', '8D', '8H', '8S',
    '9C', '9D', '9H', '9S',
    '10C', '10D', '10H', '10S',
    'JC', 'JD', 'JH', 'JS',
    'QC', 'QD', 'QH', 'QS',
    'KC', 'KD', 'KH', 'KS',
    'AC', 'AD', 'AH', 'AS',
]

// -------------------SET UP ALL FILES------------------------

app.use('/style', express.static(__dirname + '/style'))
app.use('/cards', express.static(__dirname + '/cards'))
app.use('/cardsUp', express.static(__dirname + '/cardsUp'))
app.use('/js', express.static(__dirname + '/js'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))


// -------------------------------------ONCE A SOCKET HAS CONNECTED--------------------------------------

io.on('connection', (socket) => {

    // -------------------Room socket functions-------------------------------

    socket.on('createRoom', (roomName) => {
        if (rooms.includes(roomName)) {
            console.log('Error: room name already in use')
        } else {
            rooms.push(roomName)
            socket.join(roomName)
            let obj = {
                'room': roomName,
                'id': socket.id
            }
            hosts[socket.id] = roomName;
            console.log('Created room: ' + roomName);
            io.in(roomName).emit('createRoom', obj);
        }
    })
    socket.on('joinRoom', (roomName) => {
        console.log("inside joinRoom");
        if (rooms.includes(roomName)) {
            rooms.push(roomName)
            socket.join(roomName)
            let obj = {
                'room': roomName,
                'id': socket.id
            }
            io.in(roomName).emit('joinRoom', obj);
        } else {
            console.log('Error: No room with this name')
        }
    })
    socket.on('join', (obj) => {
        console.log(obj.username)
        io.in(obj.roomName).emit('playerJoin',
        {
            'socketid': socket.id,
            'name': obj.username,
            'id': idNumber, 
            'team': 0,
            'hand': [],
        });
        io.in(obj.roomName).emit('join', 
        {
            'socketid': socket.id,
            'name': obj.username,
            'id': idNumber, 
            'team': 0,
            'hand': [],
        });
        idNumber += 1
    })
    socket.on('disconnect', (reason) => {
        console.log('User has disconnected');
        console.log(reason);
        console.log(socket.id)
        if (socket.id in hosts) {
            console.log('host has disconnected');
            io.in(hosts[socket.id]).emit('hostDisconnected');
            var index = rooms.indexOf(hosts[socket.id]);
            if (index !== -1) {
                rooms.splice(index, 1);
            }
            delete hosts[socket.id];
        } else {
            io.emit('leaveRoom', socket.id);
        }
    })
    socket.on('everyoneLeave', (room) => {
        console.log("exiting room");
        socket.leave(room);
        if (socket.id in hosts) {
            console.log('host has disconnected');
            io.in(hosts[socket.id]).emit('hostDisconnected');
            var index = rooms.indexOf(hosts[socket.id]);
            if (index !== -1) {
                rooms.splice(index, 1);
            }
            delete hosts[socket.id];
        }
    })

    socket.on('leaveRoom', (obj) => {
        socket.leave(obj.room);
        if (obj.isHost) {
            io.in(obj.room).emit('hostDisconnected');
        } else {
            io.in(obj.room).emit('leaveRoom', obj.socketid);
        }
    })

    socket.on('restartGame', (room) => {
        console.log("Restarting game");
        io.in(room).emit('restartGame');
    })


    // -------------------Game creating socket functions----------------------------

    socket.on('updateInformation', (obj) => {
        io.in(obj.roomName).emit('updateInformation', obj);
    })
    socket.on('changeTeam', (obj) => {
        io.in(obj.roomName).emit('changeTeam', obj);
    })
    socket.on('startGame', (obj) => {
        console.log("Starting Game")
        let deck = cards.slice();
        for (let i = 0; i < 3; ++i) {
            deck.sort(() => Math.random() - 0.5);
        }
        obj.deck = deck;
        io.in(obj.roomName).emit('startGame', obj);
    })

    // -------------------Gameplay socket functions----------------------------
    socket.on('playCard', (obj) => {
        io.in(obj.roomName).emit('playCard', obj);
    })


})

// -----------------LISTEN ON PORT 80-----------------

http.listen(8080, () => console.log('listening on port 8080'))