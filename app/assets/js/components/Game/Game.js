var React = require('react');
var ReactRedux = require('react-redux');
var Immutable = require('immutable');

var List = Immutable.List;
var Map = Immutable.Map;

var Board = require('../Board/Board.js');
var Room = require('../Room/Room.js');
var Error = require('../Error/Error.js');

var Chess = require('../../lib/chess.min.js');

var Game = React.createClass({
	getInitialState: function () {
		return {
			gameState: 'WAITING',
			message: '',
			userId: '',
			creatorId: '',
			boardNum: -1,
			white: [],
			black: [],
			boards: [],
			pieces: {
				w: {
					q: 1,
					r: 1,
					b: 1,
					n: 1,
					p: 1
				},
				
				b: {
					q: 1,
					r: 1,
					b: 1,
					n: 1,
					p: 1
				},
			}
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
		
		socket.emit('room:join', {
			token: this.props.token
		});
	},
	
	_gameStart: function (data) {
		var boards = [];
		
		for (var i = 0; i < data.numOfBoards; i++)
			boards.push(new Chess());
		
		this.setState({
			gameState: 'START',
			boardNum: data.boardNum,
			boards: boards
		});
	},
	
	_gameMoved: function (data) {
		if (this.state.boards[data.boardNum].get(data.to) != null) {
			var newPieces = this.state.pieces;
			var piece = this.state.boards[data.boardNum].get(data.to);
			console.log("INC", piece.color, piece.type);
			newPieces[piece.color == 'w' ? 'b' : 'w'][piece.type]++;
			this.setState({pieces: newPieces});
		}
		
		var newBoards = this.state.boards;
		newBoards[data.boardNum].move({from: data.from, to: data.to, promotion: 'q'});
		this.setState({boards: newBoards});
		
		if (this.state.boardNum == data.boardNum) {
			if (this.state.boards[this.state.boardNum].in_checkmate()) {
				this.setState({gameState: 'LOST'});
			} else if (this.state.boards[this.state.boardNum].in_draw() || 
					   this.state.boards[this.state.boardNum].in_stalemate() ||
					   this.state.boards[this.state.boardNum].in_threefold_repetition()) {
				this.setState({gameState: 'DRAWN'});
			}
		}
	},
	
	_gamePlaced: function (data) {
		var newPieces = this.state.pieces;
		newPieces[data.color][data.piece]--;
		this.setState({pieces: newPieces});
		
		var newBoards = this.state.boards;
		newBoards[data.boardNum].put({type: data.piece, color: data.color}, data.pos);
		this.forceTurn(data.boardNum, data.color == 'b' ? 'w' : 'b');
		this.setState({boards: newBoards});
		
		if (this.state.boardNum == data.boardNum) {
			if (this.state.boards[this.state.boardNum].in_checkmate()) {
				this.setState({gameState: 'LOST'});
			} else if (this.state.boards[this.state.boardNum].in_draw() || 
					   this.state.boards[this.state.boardNum].in_stalemate() ||
					   this.state.boards[this.state.boardNum].in_threefold_repetition()) {
				this.setState({gameState: 'DRAWN'});
			}
		}
	},
	
	_tokenInvalid: function () {
		this.setState({message: 'THIS TOKEN IS INVALID'});
	},
	
	_roomFull: function () {
		this.setState({message: 'THIS ROOM IS FULL'});
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
		if (this.state.gameState == 'START')
			this.setState({gameState: 'DISCONNECTED'});
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
		
		var currBoard = this.state.boards[this.state.boardNum];
		
		if (currBoard.in_checkmate())
			this.setState({gameState: 'WON'});
		else if (currBoard.in_draw() || 
				 currBoard.in_stalemate() ||
				 currBoard.in_threefold_repetition())
			this.setState({gameState: 'DRAWN'})
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
			this.setState({message: 'Teams must be of equal size!'});
			return;
		}
		
		socket.emit('game:start', {
			token: this.props.token
		});
		this.setState({message: ''});
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
	
	render: function () {
		var creatorButton = <form onSubmit={this.handlePlay}><input type="submit"/></form>;
		console.log(this.state.white, this.state.black, this.getColor());
		if (this.state.gameState == 'START') {
			return (
				<div className="game">
					<h1>Share this link with your friends: {window.location.href}</h1> 
					<h1>Your current id is {this.state.userId}</h1>
					<Board color={this.getColor()} onMove={this.handleMove} board={this.state.boards[this.state.boardNum]} pieces={this.state.pieces}/>
					<Error message={this.state.message}/>
				</div>
			);
		} else if (this.state.gameState == 'WAITING') {
			return (
				<div className="game">
					<h1>Share this link with your friends: {window.location.href}</h1>
					<h1>Your current id is {this.state.userId}</h1>
					<Room white={this.state.white} black={this.state.black} onSubmit={this.handleSubmit}/>
					{this.state.userId == this.state.creatorId ? creatorButton : ""}
					<Error message={this.state.message}/>
				</div>
			);
		} else {
			return (<h1>{this.state.gameState}</h1>);
		}
	}
});

module.exports = Game;