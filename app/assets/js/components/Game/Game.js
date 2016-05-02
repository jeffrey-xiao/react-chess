var React = require('react');
var ReactRedux = require('react-redux');
var Immutable = require('immutable');

var List = Immutable.List;
var Map = Immutable.Map;

var Board = require('../Board/Board.js');
var Room = require('../Room/Room.js');
var Clock = require('../Clock/Clock.js');
var Modal = require('../Modal/Modal.js');
var History = require('../History/History.js');
var Chat = require('../Chat/Chat.js');

var Chess = require('../../lib/chess.min.js');
var Functions = require('../../lib/functions.js');

var Game = React.createClass({
	getInitialState: function () {
		return {
			gameState: 'WAITING',
			gameMode: '',
			
			modalMessage: '',
			modalCallback: this.clearModalMessage, 
			
			userId: '',
			username: '',
			creatorId: '',
			
			boardNum: -1,
			
			// list of sockets
			team1: [],
			team2: [],
			
			// list of chessboards
			boards: [],
			
			// list of timers
			teamTimers1: [],
			teamTimer2: [],
			
			// history of moves made of current board
			history: [],
			
			// list of pieces
			pieces: [],
			
			messages: [],
			
			lastSquares: []
		};
	},
	
	componentDidMount: function () {
		socket.on('game:move', this._gameMoved);
		socket.on('game:place', this._gamePlaced);
		socket.on('game:start', this._gameStart);
		socket.on('token:invalid', this._tokenInvalid);
		socket.on('room:full', this._roomFull);
		socket.on('room:enter', this._roomEnter);
		socket.on('room:update', this._roomUpdate);
		socket.on('room:alreadyStarted', this._roomAlreadyStarted);
		socket.on('game:timeupdate', this._gameTimeupdate);
		socket.on('game:timeout', this._gameTimeout);
		socket.on('chat:receive', this._chatReceive);
		
		socket.emit('room:join', {
			token: this.props.token
		});
	},
	
	_roomAlreadyStarted: function () {
		var clearModalMessage = this.clearModalMessage;	
		this.setState({
			modalMessage: 'The game has already been started!', 
			gameState: 'FULL',
			modalCallback: function () {
				clearModalMessage();
				window.location.href = "/";
			}
		});
	},
	
	_gameTimeout: function (data) {
		if (this.state.boardNum == data.boardNum) {
			if (this.getColor() == data.color)
				this.setState({gameState: 'STOP', modalMessage: 'You have lost!'});
			else
				this.setState({gameState: 'STOP', modalMessage: 'You have won!'});
		}
	},
	
	_chatReceive: function (data) {
		var newMessages = this.state.messages;
		newMessages.push({
			author: data.author,
			time: data.time,
			body: data.body
		});
		this.setState({messages: newMessages});
	},
	
	_gameTimeupdate: function (data) {
		var newTeamTimers1 = this.state.teamTimers1;
		var newTeamTimers2 = this.state.teamTimers2;
		
		if (data.color == 'b')
			newTeamTimers2[data.boardNum] = data.time;
		else
			newTeamTimers1[data.boardNum] = data.time;
		
		this.setState({teamTimers2: newTeamTimers2, teamTimers1: newTeamTimers1});
	},
	
	_gameStart: function (data) {
		var boards = [];
		var teamTimers1 = [];
		var teamTimers2 = [];
		var lastSquares = [];
		var pieces = []
		
		for (var i = 0; i < data.numOfBoards; i++) {
			boards.push(new Chess());
			teamTimers1.push(data.time);
			teamTimers2.push(data.time);
			lastSquares.push(['', '']);
			pieces.push({
				w: {
					q: 0,
					r: 0,
					b: 0,
					n: 0,
					p: 0
				},
				
				b: {
					q: 0,
					r: 0,
					b: 0,
					n: 0,
					p: 0
				},
			});
		}
		
		this.setState({
			gameState: 'START',
			boardNum: data.boardNum,
			boards: boards,
			teamTimers1: teamTimers1,
			teamTimers2: teamTimers2,
			lastSquares: lastSquares,
			pieces: pieces
		});
	},
	
	_gameMoved: function (data) {
		var newBoards = this.state.boards;
		newBoards[data.boardNum] = new Chess(data.fen);
		
		var newLastSquares = this.state.lastSquares;
		newLastSquares[data.boardNum] = [data.from, data.to];
		
		if (data.boardNum == this.state.boardNum)
			this.setState({boards: newBoards, lastSquares: newLastSquares});
		
		if (data.piece != null) {
			if (this.state.gameMode == 'NORMAL') {
				var newPieces = this.state.pieces;
				newPieces[data.boardNum][data.color == 'w' ? 'b' : 'w'][data.piece]++;
				this.setState({pieces: newPieces});
			} else if (this.state.gameMode == 'CRAZYHOUSE') {
				var newPieces = this.state.pieces;
				
				for (var i = 0; i < newPieces.length; i++)
					newPieces[i][data.color][data.piece]++;
				
				this.setState({pieces: newPieces});
			} else if (this.state.gameMode == 'BUGHOUSE') {
				var newPieces = this.state.pieces;
				newPieces[(data.boardNum + 1) % 2][data.color == 'w' ? 'b' : 'w'][data.piece]++;
				this.setState({pieces: newPieces});
			}
		}
		
		if (data.boardNum == this.state.boardNum) {
			var newHistory = this.state.history;
			newHistory.push(data.san);
			this.setState({history: newHistory});
		}
				
		this.handleGameover();
	},
	
	_gamePlaced: function (data) {
		var newBoards = this.state.boards;
		newBoards[data.boardNum] = new Chess(data.fen);
		
		var newLastSquares = this.state.lastSquares;
		newLastSquares[data.boardNum] = [data.pos, ''];
		
		this.setState({boards: newBoards, lastSquares: newLastSquares});
		
		if (this.state.gameMode == 'BUGHOUSE') {
			var newPieces = this.state.pieces;
			newPieces[data.boardNum][data.color][data.piece]--;
			this.setState({pieces: newPieces});
		} else if (this.state.gameMode == 'CRAZYHOUSE') {
			var newPieces = this.state.pieces;
			
			for (var i = 0; i < newPieces.length; i++)
				newPieces[i][data.color][data.piece]--;
			
			this.setState({pieces: newPieces});
		}	
		
		if (data.boardNum == this.state.boardNum) {
			var newHistory = this.state.history;
			newHistory.push(data.san);
			this.setState({history: newHistory});
		}
		
		this.handleGameover();
	},
	
	_tokenInvalid: function (data) {
		var clearModalMessage = this.clearModalMessage;
		this.setState({
			modalMessage: 'This token is invalid: ' + data.message,
			modalCallback: function () {
				clearModalMessage();
				window.location.href = "/";
			}
		});
	},
	
	_roomFull: function () {
		var clearModalMessage = this.clearModalMessage;	
		this.setState({
			modalMessage: 'This room is full!', 
			gameState: 'FULL',
			modalCallback: function () {
				clearModalMessage();
				window.location.href = "/";
			}
		});
	},
	
	_roomEnter: function (data) {
		console.log("Entered room");
		this.setState({
			creatorId: data.creatorId,
			userId: data.userId,
			username: data.username,
			gameMode: data.gameMode
		});
	},
	
	_roomUpdate: function (data) {
		console.log("Updated room");
		if (this.state.gameState == 'START' && data.boardNum == this.state.boardNum) {
			this.setState({
				gameState: 'STOP',
				modalMessage: 'Your opponent has disconnected!'
			});
			
			socket.emit('game:end', {
				boardNum: this.state.boardNum,
				token: this.props.token
			});
		}
		this.setState({
			team1: data.team1,
			team2: data.team2
		});
	},	
	
	handleMove: function (from, to, piece, pos, color) {
		if (from != null && to != null) {
			socket.emit('game:move', {
				from: from,
				to: to,
				color: color,
				token: this.props.token,
				boardNum: this.state.boardNum
			});
		} else if (piece != null && pos != null && color != null) {
			socket.emit('game:place', {
				piece: piece,
				pos: pos,
				color: color,
				token: this.props.token,
				boardNum: this.state.boardNum
			});
		}
	},
	
	handleRoomChange: function (newTeam) {
		socket.emit('room:update', {
			userId: this.state.userId,
			newTeam: newTeam,
			token: this.props.token
		});
	},
	
	handlePlay: function (e) {
		e.preventDefault();
		
		if (this.state.team1.length != this.state.team2.length) {
			this.setState({modalMessage: 'Teams must be of equal size!'});
			return;
		}

		if (this.state.gameMode == 'BUGHOUSE' && (this.state.team1.length != 2 || this.state.team2.length != 2)) {
			this.setState({modalMessage: 'Teams must have two players each!'});
			return;
		}
		
		socket.emit('game:start', {
			token: this.props.token
		});
		
		this.clearModalMessage();
	},
	
	getColor: function () {
		for (var i = 0; i < this.state.team1.length; i++)
			if (this.state.team1[i].userId == this.state.userId) {
				if (this.state.gameMode == 'BUGHOUSE') {
					return i == 0 ? 'w' : 'b';
				} else {
					return 'w';
				}
			}
		
		for (var i = 0; i < this.state.team2.length; i++) {
			if (this.state.team2[i].userId == this.state.userId) {
				if (this.state.gameMode == 'BUGHOUSE') {
					return i == 0 ? 'b' : 'w';
				} else {
					return 'b';
				}
			}
		}
		return '';
	},
	
	forceTurn: function (boardNum, color) {
		var newBoards = this.state.boards;
		var tokens = newBoards[boardNum].fen().split(' ');
		tokens[1] = color;
		newBoards[boardNum].load(tokens.join(' '));
		this.setState({boards: newBoards});
	},
	
	handleGameover: function () {
		var board = this.state.boards[this.state.boardNum];
		var pieces = this.state.pieces[this.state.boardNum];
		var color = this.state.boards[this.state.boardNum].turn();

		if (Functions.isCheckmate(board, pieces, color)) {
			if (this.state.boards[this.state.boardNum].turn() == this.getColor())
				this.setState({
					gameState: 'STOP',
					modalMessage: 'You have lost!'
				});
			else {
				this.setState({
					gameState: 'STOP',
					modalMessage: 'You have won!'
				});
			}
			
			socket.emit('game:end', {
				boardNum: this.state.boardNum,
				token: this.props.token
			});
			
		} else if (Functions.isDrawn(board, pieces, color)) {
			this.setState({
				gameState: 'STOP',
				modalMessage: 'Game was drawn!'
			});
			
			socket.emit('game:end', {
				boardNum: this.state.boardNum,
				token: this.props.token
			});
		}
	},
	
	sendChatMessage: function (body) {
		socket.emit('chat:send', {
			author: this.state.username,
			body: body,
			token: this.props.token
		});
	},
	
	clearModalMessage: function () {
		this.setState({modalMessage: ''});
	},
	
	render: function () {
		if (this.state.gameState == 'START' || this.state.gameState == 'STOP') {
			return (
				<div className="game">
					<div className="game-header">
						<Clock 
							teamTimers1={this.state.teamTimers1[this.state.boardNum]}
							teamTimers2={this.state.teamTimers2[this.state.boardNum]}
							boardNum={this.state.boardNum}
							gameMode={this.state.gameMode}
							turn={this.state.boards[this.state.boardNum].turn()}/>
						<a className="button new-game" href="/" target="_blank">New Game</a>
						<div className="clear"></div>
					</div>
					<h3>Your current username is {this.state.username}</h3>
					<div className="col">
						<Board color={this.getColor()} 
							onMove={this.handleMove} 
							board={this.state.boards[this.state.boardNum]} 
							pieces={this.state.pieces[this.state.boardNum]}
							gameState={this.state.gameState}
							gameMode={this.state.gameMode}
							lastSquares={this.state.lastSquares[this.state.boardNum]}
							playable={true}/>
					</div>
					{
						this.state.gameMode == 'BUGHOUSE' ?
						<div className="col">
							<Board color={this.getColor() == 'w' ? 'b' : 'w'} 
								onMove={this.handleMove} 
								board={this.state.boards[(this.state.boardNum + 1) % 2]} 
								pieces={this.state.pieces[(this.state.boardNum + 1) % 2]}
								gameState={this.state.gameState}
								gameMode={this.state.gameMode}
								lastSquares={this.state.lastSquares[(this.state.boardNum + 1) % 2]}
								playable={false}/>
						</div> : ''
					}
					<div className="col">
						<History history={this.state.history}/>
						<Chat 
							messages={this.state.messages}
							onSubmit={this.sendChatMessage}
							username={this.state.username}/>
					</div>
					<Modal 
						message={this.state.modalMessage}
						onSubmit={this.state.modalCallback}/>
				</div>
			);
		} else if (this.state.gameState == 'WAITING') {
			return (
				<div className="game">
					<h1>Share this link with your friends: {window.location.href}</h1> 
					<h1>Your current username is {this.state.username}</h1>
					<Room 
						team1={this.state.team1} 
						team2={this.state.team2} 
						onRoomChange={this.handleRoomChange}
						onPlay={this.handlePlay}
						isCreator={this.state.userId == this.state.creatorId}
						gameMode={this.state.gameMode}/>
					
					<Modal 
						message={this.state.modalMessage}
						onSubmit={this.state.modalCallback}/>
				</div>
			);
		} else {
			return (
				<Modal 
					message={this.state.modalMessage}
					onSubmit={this.state.modalCallback}/>
			);
		}
	}
});

module.exports = Game;