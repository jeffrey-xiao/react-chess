var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var Immutable = require('immutable');
var SortedSet = require("collections/sorted-set");

var Map = Immutable.Map;
var List = Immutable.List;

var Timer = require('./app/assets/js/lib/timer');
var Chess = require('./app/assets/js/lib/chess.min.js').Chess;

var hostname = process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var srcPath = __dirname;
var destPath = __dirname;

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
var players = Map();
var availableKeys = SortedSet();
var maxKey = 0;

io.on('connection', function (socket) {
	console.log('a user has connected:', socket.id);
	socket.on('disconnect', function () {
		console.log('a user disconnected');
		if (players.get(socket.id) == null)
			return;
		
		var token = players.getIn([socket.id, 'token']);
		var username = players.getIn([socket.id, 'username']);
		
		
		if (username.startsWith("Guest")) {
			var currUser = parseInt(username.substr(5));
			availableKeys.push(currUser);
			while (availableKeys.findGreatest() != null && availableKeys.findGreatest().value == maxKey) {
				maxKey--;
				availableKeys.remove(availableKeys.findGreatest().value);
			}
		}
		
		players.delete(socket.id);
		
		if (games.get(token) == null)
			return;
		
		var boardNum = 0;
		
		games = games.updateIn([token, 'team1'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).get('socket').id == socket.id) {
					boardNum = players.get(i).get('boardNum');
					players = players.delete(i);
					break;
				}
			}
			return players;
		});
		
		games = games.updateIn([token, 'team2'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).get('socket').id == socket.id) {
					boardNum = players.get(i).get('boardNum');
					players = players.delete(i);
					break;
				}
			}
			return players;
		});
		
		var team1 = []
		var team2 = []
		
		for (var i = 0; i < games.getIn([token, 'team1']).size; i++) {
			var userId = games.getIn([token, 'team1', i, 'socket']).id; 
			team1.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		for (var i = 0; i < games.getIn([token, 'team2']).size; i++) {
			var userId = games.getIn([token, 'team2', i, 'socket']).id; 
			team2.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		io.to(token).emit('room:update', {
			team1: team1,
			team2: team2,
			boardNum: boardNum
		});
		
		if (games.getIn([token, 'creator']) != null && games.getIn([token, 'creator']).id == socket.id) {
			games = games.updateIn([token, 'teamTimers2'], function (list) {
				for (var i = 0; i < list.size; i++)
					list.get(i).stop();
				return list;
			});
			
			games = games.updateIn([token, 'teamTimers1'], function (list) {
				for (var i = 0; i < list.size; i++)
					list.get(i).stop();
				return list;
			});
			
			games = games.delete(token);
			io.to(token).emit('token:invalid', {message: 'Owner has left the room!'});
		}
	});
	
	socket.on('chat:send', function (data) {
		var date = new Date();
		io.to(data.token).emit('chat:receive', {
			author: data.author,
			time: date.getHours() + ":" + ('00' + date.getMinutes()).substr(("" + date.getMinutes()).length),
			body: data.body
		});
	});
	
	socket.on('game:move', function (data) {
		console.log("BOARD MOVED", data.from, data.to, data.color);
		
		var isPromoted = games.getIn([data.token, 'isPromoted']);
		
		var fromCol = data.from.charCodeAt(0) - 97;
		var fromRow = data.from.charCodeAt(1) - 49;
		var toCol = data.to.charCodeAt(0) - 97;
		var toRow = data.to.charCodeAt(1) - 49;
		
		var piece = null;
		var color = null;
		
		
		if (games.getIn([data.token, 'boards', data.boardNum]).get(data.to) != null) {
			piece = games.getIn([data.token, 'boards', data.boardNum]).get(data.to).type;
			if (isPromoted[toRow][toCol])
				piece = 'p';
			color = games.getIn([data.token, 'boards', data.boardNum]).turn();
		}
		
		if (isPromoted[fromRow][fromCol] || ((toRow == 0 || toRow == 7) && games.getIn([data.token, 'boards', data.boardNum]).get(data.from).type == 'p'))
			isPromoted[toRow][toCol] = true;

		isPromoted[fromRow][fromCol] = false;
		
		var san = games.getIn([data.token, 'boards', data.boardNum]).move({
			from: data.from,
			to: data.to,
			promotion: 'q'
		}).san;

		io.to(data.token).emit('game:move', {
			from: data.from,
			to: data.to,
			boardNum: data.boardNum,
			fen: games.getIn([data.token, 'boards', data.boardNum]).fen(),
			piece: piece,
			color: color,
			san: san
		});
		
		if (data.color == 'b') {
			games.getIn([data.token, 'teamTimers1', data.boardNum]).start();
			games.getIn([data.token, 'teamTimers2', data.boardNum]).stop();
		} else if (data.color == 'w') {
			games.getIn([data.token, 'teamTimers2', data.boardNum]).start();
			games.getIn([data.token, 'teamTimers1', data.boardNum]).stop();
		}
		
		games = games.updateIn([data.token, 'isPromoted'], function (arr) {
			arr = isPromoted;
			return arr;
		})
	});
	
	socket.on('game:place', function (data) {
		console.log("BOARD PLACED", data.piece, data.pos, data.color);
		
		games = games.updateIn([data.token, 'boards', data.boardNum], function (board) {
			board.put({type: data.piece, color: data.color}, data.pos);
			var tokens = board.fen().split(" ");
			tokens[1] = data.color == 'b' ? 'w' : 'b';
			board = new Chess(tokens.join(" "));
			return board;
		});
		
		var san = data.piece + "@" + data.pos;
		if (games.getIn([data.token, 'boards', data.boardNum]).in_check())
			san += '+';
		
		io.to(data.token).emit('game:place', {
			piece: data.piece,
			color: data.color,
			boardNum: data.boardNum,
			fen: games.getIn([data.token, 'boards', data.boardNum]).fen(),
			san: san,
			pos: data.pos
		});
		
		if (data.color == 'b') {
			games.getIn([data.token, 'teamTimers1', data.boardNum]).start();
			games.getIn([data.token, 'teamTimers2', data.boardNum]).stop();
		} else if (data.color == 'w') {
			games.getIn([data.token, 'teamTimers1', data.boardNum]).start();
			games.getIn([data.token, 'teamTimers1', data.boardNum]).stop();
		}
	});
	
	socket.on('game:end', function (data) {
		if (games.getIn([data.token, 'teamTimers1', data.boardNum]) != null)
			games.getIn([data.token, 'teamTimers1', data.boardNum]).stop();
		if (games.getIn([data.token, 'teamTimers2', data.boardNum]) != null)
			games.getIn([data.token, 'teamTimers2', data.boardNum]).stop();
	});
	
	socket.on('game:start', function (data) {
		
		var numOfBoards = games.getIn([data.token, 'team1']).size;
		
		var game = games.get(data.token);
		var time = game.get('time');
		var inc = game.get('inc');
		
		for (var i = 0; i < game.get('team1').size; i++) {
			game.get('team1').get(i).get('socket').emit('game:start', {
				boardNum: i, 
				numOfBoards: numOfBoards,
				time: time,
				inc: inc
			});
			game.get('team2').get(i).get('socket').emit('game:start', {
				boardNum: i, 
				numOfBoards: numOfBoards,
				time: time,
				inc: inc
			});
			
			games = games.updateIn([data.token, 'team1'], function (list) {
				for (var i = 0; i < list.size; i++)
					list = list.updateIn([i, 'boardNum'], function (boardNum) {
						boardNum = i;
						return boardNum;
					});
				return list;
			});
			
			games = games.updateIn([data.token, 'team2'], function (list) {
				for (var i = 0; i < list.size; i++)
					list = list.updateIn([i, 'boardNum'], function (boardNum) {
						boardNum = i;
						return boardNum;
					});
				return list;
			});
			
			games = games.updateIn([data.token, 'teamTimers1'], function (list) {
				list = list.push(new Timer(time, inc, i, function (time, boardNum) {
					io.to(data.token).emit('game:timeupdate', {
						boardNum: boardNum,
						color: 'w',
						time: time
					});
				}, function (boardNum) {
					io.to(data.token).emit('game:timeout', {
						boardNum: boardNum,
						color: 'w'
					});
				}));
				return list;
			});
			
			games = games.updateIn([data.token, 'teamTimers2'], function (list) {
				list = list.push(new Timer(time, inc, i, function (time, boardNum) {
					io.to(data.token).emit('game:timeupdate', {
						boardNum: boardNum,
						color: 'b',
						time: time
					});
				}, function (boardNum) {
					io.to(data.token).emit('game:timeout', {
						boardNum: boardNum,
						color: 'b'
					});
				}));
				return list;
			});
			
			games = games.updateIn([data.token, 'boards'], function (list) {
				list = list.push(new Chess());
				return list;
			});
			
			games = games.updateIn([data.token, 'isPromoted'], function (arr) {
				for (var row = 0; row < 8; row++)
					arr.push(new Array(8));
				for (var row = 0; row < 8; row++)
					for (var col = 0; col < 8; col++)
						arr[row][col] = false;
				return arr;
			});
		}
		
		clearTimeout(games.getIn([data.token, 'timeout']));
		games = games.updateIn([data.token, 'state'], function (state) {
			state = 'STARTED';
			return state;
		});
	});
	
	socket.on('room:create', function (data) {
		console.log("Created room", data.token);

		var timeout = setTimeout(function () {
			console.log("TOKEN IS INVALID NOW");
			games = games.delete(data.token);
			io.to(data.token).emit('token:invalid', {message: 'The room has expired!'});
		}, 60 * 1000 * 20);
		
		games = games.set(data.token, Map({
			creator: null,
			time: data.time,
			inc: data.inc,
			roomSize: data.teamSize * 2,
			gameMode: data.gameMode,
			team1: List(),
			team2: List(),
			teamTimers1: List(),
			teamTimers2: List(),
			boards: List(),
			isPromoted: [[]],
			timeout: timeout,
			state: 'WAITING'
		}));
		
		socket.emit('room:created', {token: data.token});
	});
	
	socket.on('room:join', function (data) {
		console.log("joining room", data.token);
		var game = games.get(data.token);
		
		if (!game) {
			socket.emit('token:invalid', {message: 'The room does not exist!'});
			return;
		}

		var playerCnt = game.get('team1').size + game.get('team2').size;
		
		if (playerCnt >= game.get('roomSize')) {
			console.log("Room is full");
			socket.emit('room:full');
			return;
		}
		
		if (game.get('state') == 'STARTED') {
			console.log("Room has started");
			socket.emit('room:alreadyStarted');
		}
		
		socket.join(data.token);
		
		var username;
		if (availableKeys.length == 0) {
			username = ++maxKey;
		} else {
			username = availableKeys.findLeast().value;
			availableKeys.remove(username);
		}
		
		players = players.set(socket.id, Map({
			token: data.token,
			username: "Guest" + username
		}));
		
		games = games.updateIn([data.token, 'creator'], function (s) {
			if (s == null)
				s = socket;
			return s;
		});
		
		console.log("Updating players");
		games = games.updateIn([data.token, 'team1'], function (players) {
			players = players.push(Map({
				socket: socket,
				boardNum: 0
			}));
			return players;
		});
		
		console.log("Emitting a room enter", games.getIn([data.token, 'creator']).id);
		socket.emit('room:enter', {
			creatorId: games.getIn([data.token, 'creator']).id,
			userId: socket.id,
			username: "Guest" + username,
			gameMode: games.getIn([data.token, 'gameMode'])
		});
		
		
		var team1 = []
		var team2 = []
		
		for (var i = 0; i < games.getIn([data.token, 'team1']).size; i++) {
			var userId = games.getIn([data.token, 'team1', i, 'socket']).id; 
			team1.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		for (var i = 0; i < games.getIn([data.token, 'team2']).size; i++) {
			var userId = games.getIn([data.token, 'team2', i, 'socket']).id; 
			team2.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		io.to(data.token).emit('room:update', {
			team1: team1,
			team2: team2
		});
	});
	
	socket.on('room:update', function (data) {
		var playerToAdd;
		games = games.updateIn([data.token, 'team1'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).get('socket').id == data.userId) {
					playerToAdd = players.get(i);
					players = players.delete(i);
				}
			}
			return players;
		});
		
		games = games.updateIn([data.token, 'team2'], function (players) {
			for (var i = 0; i < players.size; i++) {
				if (players.get(i).get('socket').id == data.userId) {
					playerToAdd = players.get(i);
					players = players.delete(i);
				}
			}
			return players;
		});

		games = games.updateIn([data.token, data.newTeam], function (players) {
			players = players.push(playerToAdd);
			return players;
		});
		
		var team1 = []
		var team2 = []
		
		for (var i = 0; i < games.getIn([data.token, 'team1']).size; i++) {
			var userId = games.getIn([data.token, 'team1', i, 'socket']).id; 
			team1.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		for (var i = 0; i < games.getIn([data.token, 'team2']).size; i++) {
			var userId = games.getIn([data.token, 'team2', i, 'socket']).id; 
			team2.push({
				userId: userId,
				username: players.getIn([userId, 'username'])
			});
		}
		
		io.to(data.token).emit('room:update', {
			team1: team1,
			team2: team2
		});
	});
});

app.use("/", express.static(__dirname + '/'));

http.listen(port, hostname, function () {
	console.log("Server is listening on http://" + hostname + "/" + port);
});