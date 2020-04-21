let socket = null;
var app = new Vue({
el: '#app',
data: {
    roomName: '',
    isHost: false,
    hostSocketId: 0,
    state: 0,
    chips: ['cards/blue.png', 'cards/green.png', 'cards/red.png'],

    username: '',
    users: [],
    usersInLobby: [],
    player: {},

    gameData: {},
    deck: [],
    board: [],
    playerUp: 0,
    order: [],
    pickedCard: '',
    pickedCardIndex: 0,
    twoEyed: false,
    oneEyed: false,

},
// -----------------------------------------------------------APPLICATION OPENING FUNCTIONS---------------------------------------------------------------------
created: function () {
    // Current server that we are connecting to
    socket = io();
},
// -----------------------------------------------------------SOCKET LISTENER FUNCTIONS---------------------------------------------------------------------
mounted: function () {

    socket.on('createRoom', function (obj) {
        console.log('Created room: ' + obj.room);
        app.isHost = true;
        app.hostSocketId = socket.id;
        app.roomName = obj.room;
        app.state = 1
    })
    socket.on('joinRoom', function (obj) {
        if (app.isHost) {
            app.updateInformation();
        }
        if (obj.id === socket.id) {
            console.log('Joined room: ' + obj.room);
            app.roomName = obj.room
            app.state = 3;
        }
    })
    socket.on('updateInformation', function (obj) {
        app.roomName = obj.roomName;
        app.hostSocketId = obj.hostSocketId;
        app.usersInLobby = obj.usersInLobby;
        app.users = obj.users;
    })
    socket.on('join', function (user) {
        console.log('pushing to users')
        app.users.push(user);
        app.usersInLobby.push(user);
    })
    socket.on('playerJoin', function (user) {
        // Gets the indv player array set up
        if (user.socketid === socket.id) {
            console.log('Getting individual data for player');
            app.player = user;
        }
    })
    socket.on('changeTeam', function (obj) {
        // Changes team for user
        for (let i = 0; i < app.users.length; ++i) {
            if (app.users[i].socketid === obj.socketid) {
                app.users[i].team = obj.team;
            }
        }
    })
    socket.on('startGame', function (obj) {
        console.log("Starting Game")
        console.log(obj)
        for (let i = 0; i < app.users.length; ++i) {
            for (let j = 0; j < 5; ++j) {
                app.users[i].hand.push(obj.deck.shift())
            }
        }
        for (let i = 0; i < app.users.length; ++i) {
            if (app.users[i].socketid === app.player.socketid) {
                app.player.hand = app.users[i].hand.slice()
            }
        }
        app.gameData = obj;
        app.deck = obj.deck.slice()
        console.log(app.player);

        // Create board array 
        for (let i = 0; i < 100; ++i) {
            app.board.push(0);
        }

        // get order of players
        orderTemp = [];
        if (obj.isThree) {
            orderTemp.push(obj.team1.shift())
            orderTemp.push(obj.team2.shift())
            orderTemp.push(obj.team3.shift())
            orderTemp.push(obj.team1.shift())
            orderTemp.push(obj.team2.shift())
            orderTemp.push(obj.team3.shift())
        } else {
            orderTemp.push(obj.team1.shift())
            orderTemp.push(obj.team2.shift())
            orderTemp.push(obj.team1.shift())
            orderTemp.push(obj.team2.shift())
        }
        app.order = orderTemp.slice();
        app.state = 5;
    })
    socket.on('playCard', function (obj) {
        // Gets the indv player array set up
        console.log(obj)
        app.deck = obj.deck.slice();
        app.board = obj.board.slice();
        app.pickedCard = '';
        app.pickedCardIndex = 0;
        app.oneEyed = false;
        app.twoEyed = false;
        console.log(app.playerUp)
        console.log(app.order.length);
        if (app.playerUp >= app.order.length - 1) {
            app.playerUp = 0;
        } else {
            app.playerUp += 1;
        }
    })

},
// -----------------------------------------------------------METHODS---------------------------------------------------------------------
methods: {
    createRoom() {
        console.log("Creating room")
        this.roomName = Math.random().toString(36).substring(7);
        this.roomName = this.roomName.toUpperCase();
        socket.emit('createRoom', this.roomName);
    },
    joinRoom() {
        if (this.roomName === '') {
            alert('please enter valid room name')
        } else {
            this.roomName = this.roomName.toUpperCase();
            socket.emit('joinRoom', this.roomName);
        }
    },
    updateInformation() {
        console.log("Updating info for all users");
        let obj = {
            'roomName': this.roomName,
            'hostSocketId': this.hostSocketId,
            'users': this.users,
            'usersInLobby': this.usersInLobby,
        }
        socket.emit('updateInformation', obj);
    },
    setUsername: function () {
        // Sets the username of the user and sends to server
        console.log("Setting username")
        if (this.username === '') {
            alert('Please type in a valid username.');
        } else {
            let obj = {
                'username': this.username,
                'roomName': this.roomName,
            }
            socket.emit('join', obj);
            this.username = '';
            this.state = 4;
        }
    },
    changeTeam() {
        console.log('User changing teams');
        if (this.player.team === 3) {
            this.player.team = 1;
        } else {
            this.player.team += 1
        }
        let obj = {
            'team': this.player.team,
            'roomName': this.roomName,
            'socketid': this.player.socketid,
        }
        socket.emit('changeTeam', obj);
    },
    startGame() {
        let team1 = []
        let team2 = []
        let team3 = []
        let isThree = true;
        let missingColor = 0;
        for (let i = 0; i < this.users.length; ++i) {
            if (this.users[i].team === 1) {
                team1.push(this.users[i]);
            }
            else if (this.users[i].team === 2) {
                team2.push(this.users[i]);
            }
            else if (this.users[i].team === 3) {
                team3.push(this.users[i]);
            } else {
                alert("Make sure all users are in a team");
                return;
            }
        }
        let obj = {}
        let vacants = 0
        // Check if team is vacant
        if (team1.length === 0) {
            isThree = false;
            missingColor = 1;
            vacants += 1
            obj = {
                'roomName': this.roomName,
                'team1': team2,
                'team2': team3,
                'isThree': false,
                'team1Color': 2,
                'team2Color': 3,
            }
        }
        if (team2.length === 0) {
            isThree = false;
            missingColor = 2;
            vacants += 1
            obj = {
                'roomName': this.roomName,
                'team1': team1,
                'team2': team3,
                'isThree': false,
                'team1Color': 1,
                'team2Color': 3,
            }
        }
        if (team3.length === 0) {
            isThree = false;
            missingColor = 3;
            vacants += 1
            obj = {
                'roomName': this.roomName,
                'team1': team1,
                'team2': team2,
                'isThree': false,
                'team1Color': 1,
                'team2Color': 2,
            }
        }
        if (vacants > 1) {
            alert("Make sure there are at least two teams");
            return;
        }
        if (isThree) {
            obj = {
                'roomName': this.roomName,
                'team1': team1,
                'team2': team2,
                'team3': team3,
                'isThree': true,
                'team1Color': 1,
                'team2Color': 2,
                'team3Color': 3
            }
        }
        console.log("Sending game info to server")
        socket.emit('startGame', obj);
    },
    pickCard(card) {
        this.oneEyed = false;
        this.twoEyed = true;
        card = parseInt(card);
        console.log("User looking at playing card " + card);
        this.pickedCard = this.player.hand[card];
        this.pickedCardIndex = card;

        if (this.pickedCard === 'JD' || this.pickedCard === 'JC') {
            this.twoEyed = true;
        } else if (this.pickedCard === 'JS' || this.pickedCard === 'JD') {
            this.oneEyed = true;
        }
    },
    playCard(card) {
        console.log("Playing card")
        card = parseInt(card);
        this.player.hand[this.pickedCardIndex] = this.deck.shift();
        this.board[card] = this.player.team;
        let obj = {
            'roomName': this.roomName,
            'deck': this.deck,
            'board': this.board,
        }
        socket.emit('playCard', obj);
    },
    removeCard(card) {
        console.log("Removing card with one eyed jack")
        card = parseInt(card);
        this.player.hand[this.pickedCardIndex] = this.deck.shift();
        this.board[card] = 0;
        console.log(this.board);
        let obj = {
            'roomName': this.roomName,
            'deck': this.deck,
            'board': this.board,
        }
        socket.emit('playCard', obj);
    }
}
})