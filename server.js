var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var Immutable = require('immutable');

var Map = Immutable.Map;
var List = Immutable.List;

var hostname = 'localhost';
var port = 8080;

var srcPath = __dirname + '/assets';
var destPath = __dirname + '/assets';

app.set('views', __dirname + '/views/pages');
app.set('view engine', 'jade');

app.use(morgan('dev'));
app.use(sassMiddleware({
	src: srcPath,
	dest: destPath,
	debug: true,
	force: true,
	outputStyle: 'expanded'
}));

app.get('/', function (req, res, next) {
	res.render('index', {
		title: 'Home'
	});
});

app.get('/play/:id', function (req, res, next) {
	res.render('play', {
		title: 'Play'
	});
});

var games = Map();
var players = Map();

io.on('connection', function (socket) {
	console.log('a user has connected', socket.id);
	socket.on('disconnect', function () {
		console.log('a user disconnected');
		if (players.get(socket.id) == null)
			return;
		
		var token = players.get(socket.id);
		
		if (games.getIn([token, 'creator']) != null && games.getIn([token, 'creator']).id == socket.id) {
			games = games.delete(token);
			players.delete(socket.id);
			return;
		}

		if (games.get(token) == null)
			return;
		
		games = games.updateIn([token, 'white'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).id == socket.id) {
					players = players.delete(i);
				}
			}
			return players;
		});
		
		games = games.updateIn([token, 'black'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).id == socket.id) {
					players = players.delete(i);
				}
			}
			return players;
		});
		
		var white = []
		var black = []
		
		for (var i = 0; i < games.getIn([token, 'white']).size; i++)
			white.push(games.getIn([token, 'white']).get(i).id);
		for (var i = 0; i < games.getIn([token, 'black']).size; i++)
			black.push(games.getIn([token, 'black']).get(i).id);
		
		io.to(token).emit('room:update', {
			white: white,
			black: black
		});
		
		players.delete(socket.id);
	});
	
	socket.on('game:move', function (data) {
		console.log("BOARD MOVED", data.userId, data.from, data.to);
		
		var opponentSocket;
		for (var i = 0; i < games.getIn([data.token, 'white']).size; i++) {
			if (games.getIn([data.token, 'white']).get(i).id == data.userId) {
				opponentSocket = games.getIn([data.token, 'black']).get(i);
			} else if (games.getIn([data.token, 'black']).get(i).id == data.userId) {
				opponentSocket = games.getIn([data.token, 'white']).get(i);
			}
		}
		opponentSocket.emit('game:move', {from: data.from, to: data.to});
	});
	
	socket.on('game:start', function (data) {
		io.to(data.token).emit('game:start');
		clearTimeout(games.getIn([data.token, 'timeout']));
	});
	
	socket.on('room:create', function (data) {
		console.log("Created room", data.token);

		var timeout = setTimeout(function () {
			console.log("TOKEN IS INVALID NOW");
			games = games.delete(data.token);
			io.to(data.token).emit('token:invalid');
		}, 60 * 1000 * 20);
		
		games = games.set(data.token, Map({
			creator: null,
			white: List(),
			black: List(),
			timeout: timeout
		}));
		
		socket.emit('room:created', {token: data.token});
	});
	
	socket.on('room:join', function (data) {
		console.log("joining room", data.token);
		var game = games.get(data.token);
		if (!game) {
			socket.emit('token:invalid');
			return;
		}

		var playerCnt = game.get('white').size + game.get('black').size;
		
		/*
		if (playerCnt >= 2) {
			console.log("Room is full");
			socket.emit('room:full');
			return;
		}
		*/
		
		console.log("Actually joining with socket");
		socket.join(data.token);
		players = players.set(socket.id, data.token);
		
		games = games.updateIn([data.token, 'creator'], function (s) {
			if (s == null)
				s = socket;
			return s;
		});
		
		console.log("Updating players");
		games = games.updateIn([data.token, 'white'], function (players) {
			players = players.push(socket);
			return players;
		});
		
		console.log("Emitting a room enter", games.getIn([data.token, 'creator']).id);
		socket.emit('room:enter', {
			creatorId: games.getIn([data.token, 'creator']).id,
			userId: socket.id
		});
		
		var white = []
		var black = []
		
		for (var i = 0; i < games.getIn([data.token, 'white']).size; i++)
			white.push(games.getIn([data.token, 'white']).get(i).id);
		for (var i = 0; i < games.getIn([data.token, 'black']).size; i++)
			black.push(games.getIn([data.token, 'black']).get(i).id);
		
		io.to(data.token).emit('room:update', {
			white: white,
			black: black
		});
	});
	
	socket.on('room:update', function (data) {
		var socketToAdd;
		games = games.updateIn([data.token, 'white'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).id == data.userId) {
					socketToAdd = players.get(i);
					players = players.delete(i);
				}
			}
			return players;
		});
		
		games = games.updateIn([data.token, 'black'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).id == data.userId) {
					socketToAdd = players.get(i);
					players = players.delete(i);
				}
			}
			return players;
		});

		games = games.updateIn([data.token, data.newColor], function (players) {
			players = players.push(socketToAdd);
			return players;
		});
		
		var white = []
		var black = []
		
		for (var i = 0; i < games.getIn([data.token, 'white']).size; i++)
			white.push(games.getIn([data.token, 'white']).get(i).id);
		for (var i = 0; i < games.getIn([data.token, 'black']).size; i++)
			black.push(games.getIn([data.token, 'black']).get(i).id);
		
		io.to(data.token).emit('room:update', {
			white: white,
			black: black
		});
	});
});

app.use("/", express.static(__dirname + '/'));

http.listen(port, function () {
	console.log("Server is running at http://" + hostname + "/" + port);
});