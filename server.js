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

// app.use(morgan('dev'));
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

io.on('connection', function (socket) {
	console.log('a user has connected');
	socket.on('disconnect', function () {
		console.log('a user disconnected');
	});
	
	socket.on('game:move', function (data) {
		console.log("BOARD MOVED", data.token, data.from, data.to);
		socket.broadcast.to(data.token).emit('game:move', {from: data.from, to: data.to});
	});
	
	socket.on('room:create', function (data) {
		console.log("Created room", data.token);

		games = games.set(data.token, Map({
			creator: socket,
			players: List()
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

		var playerCnt = game.get('players').size;
		var color = "";
		
		if (playerCnt >= 2) {
			socket.emit('room:full');
			return;
		} else if (playerCnt == 1) {
			if (game.getIn(['players', 0, 'color']) === 'b')
				color = 'w';
			else
				color = 'b';
		} else {
			color = 'w';
		}
		
		socket.join(data.token);
		
		games = games.updateIn([data.token, 'players'], function (players) {
			players = players.push(Map({
				socket: socket,
				color: color
			}));
			return players;
		});
		
		game.get('creator').emit('room:ready', {token: data.token});
		socket.emit('room:join', {color: color});
		
		if (games.get(data.token).get('players').size == 2) {
			io.to(data.token).emit('room:start');
		}
	});
});

app.use("/", express.static(__dirname + '/'));

http.listen(port, function () {
	console.log("Server is running at http://" + hostname + "/" + port);
});