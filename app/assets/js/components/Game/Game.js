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

var Game = React.createClass({
	getInitialState: function () {
		return {
			gameState: 'WAITING',
			gameType: '',
			modalMessage: '',
			modalCallback: this.clearModalMessage, 
			userId: '',
			creatorId: '',
			boardNum: -1,
			white: [],
			black: [],
			boards: [],
			whiteTimes: [],
			blackTimes: [],
			history: [],
			pieces: {
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
			},
			messages: []
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
		socket.on('game:timeupdate', this._gameTimeupdate);
		socket.on('game:timeout', this._gameTimeout);
		socket.on('chat:receive', this._chatReceive);
		
		socket.emit('room:join', {
			token: this.props.token
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
		var newWhiteTimes = this.state.whiteTimes;
		var newBlackTimes = this.state.blackTimes;
		
		if (data.color == 'b')
			newBlackTimes[data.boardNum] = data.time;
		else
			newWhiteTimes[data.boardNum] = data.time;
		
		this.setState({blackTimes: newBlackTimes, whiteTimes: newWhiteTimes});
	},
	
	_gameStart: function (data) {
		var boards = [];
		var whiteTimes = [];
		var blackTimes = [];
		for (var i = 0; i < data.numOfBoards; i++) {
			boards.push(new Chess());
			whiteTimes.push(data.time);
			blackTimes.push(data.time);
		}
		
		this.setState({
			gameState: 'START',
			boardNum: data.boardNum,
			boards: boards,
			whiteTimes: whiteTimes,
			blackTimes: blackTimes
		});
	},
	
	_gameMoved: function (data) {
		var newBoards = this.state.boards;
		newBoards[data.boardNum] = new Chess(data.fen);
		this.setState({boards: newBoards});
		
		if (data.piece != null) {
			var newPieces = this.state.pieces;
			newPieces[data.color][data.piece]++;
			this.setState({pieces: newPieces});
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
		this.setState({boards: newBoards});
		
		var newPieces = this.state.pieces;
		newPieces[data.color][data.piece]--;
		this.setState({pieces: newPieces});
		
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
			userId: data.userId
		});
	},
	
	_roomUpdate: function (data) {
		console.log("Updated room");
		if (this.state.gameState == 'START') {
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
			white: data.white,
			black: data.black
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
	
	handleSubmit: function (newColor) {
		socket.emit('room:update', {
			userId: this.state.userId,
			newColor: newColor,
			token: this.props.token
		});
	},
	
	handlePlay: function (e) {
		e.preventDefault();
		if (this.state.white.length != this.state.black.length) {
			this.setState({modalMessage: 'Teams must be of equal size!'});
			return;
		}
		
		socket.emit('game:start', {
			token: this.props.token
		});
		
		this.clearModalMessage();
	},
	
	getColor: function () {
		for (var i = 0; i < this.state.white.length; i++)
			if (this.state.white[i] == this.state.userId)
				return 'w';
		
		for (var i = 0; i < this.state.black.length; i++)
			if (this.state.black[i] == this.state.userId)
				return 'b';
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
		if (this.state.boards[this.state.boardNum].in_checkmate()) {
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
			
		} else if (this.state.boards[this.state.boardNum].in_draw() || 
				   this.state.boards[this.state.boardNum].in_stalemate() ||
				   this.state.boards[this.state.boardNum].in_threefold_repetition()) {
			console.log(this.state.boards[this.state.boardNum].in_draw());
			console.log(this.state.boards[this.state.boardNum].in_stalemate());
			console.log(this.state.boards[this.state.boardNum].in_threefold_repetition());
			console.log(this.state.boards[this.state.boardNum].insufficient_material());
			
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
			author: this.state.userId,
			body: body,
			token: this.props.token
		});
	},
	
	clearModalMessage: function () {
		this.setState({modalMessage: ''});
	},
	
	render: function () {
		var creatorButton = <form onSubmit={this.handlePlay}><input type="submit"/></form>;
		if (this.state.gameState == 'START' || this.state.gameState == 'STOP') {
			return (
				<div className="game">
					<div className="game-header">
						<Clock 
							whiteTime={this.state.whiteTimes[this.state.boardNum]}
							blackTime={this.state.blackTimes[this.state.boardNum]}
							turn={this.state.boards[this.state.boardNum].turn()}/>
						<a className="button new-game" href="/" target="_blank">New Game</a>
						<div className="clear"></div>
					</div>
					<h3>Your current id is {this.state.userId}</h3>
					<div className="col">
						<Board color={this.getColor()} 
							onMove={this.handleMove} 
							board={this.state.boards[this.state.boardNum]} 
							pieces={this.state.pieces}
							gameState={this.state.gameState}/>
					</div>
					<div className="col">
						<History history={this.state.history}/>
						<Chat 
							messages={this.state.messages}
							onSubmit={this.sendChatMessage}
							userId={this.state.userId}/>
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
					<h1>Your current id is {this.state.userId}</h1>
					<Room white={this.state.white} black={this.state.black} onSubmit={this.handleSubmit}/>
					{this.state.userId == this.state.creatorId ? creatorButton : ""}
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