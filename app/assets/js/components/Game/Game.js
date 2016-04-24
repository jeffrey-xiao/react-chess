var React = require('react');
var ReactRedux = require('react-redux');
var Immutable = require('immutable');

var List = Immutable.List;
var Map = Immutable.Map;

var Board = require('../Board/Board.js');
var Room = require('../Room/Room.js');
var BoardDispatch = require('../Board/BoardDispatch.js');
var BoardStore = require('../Board/BoardStore.js');
var BoardState = require('../Board/BoardState.js');
var Error = require('../Error/Error.js');

var Game = React.createClass({
	getInitialState: function () {
		return {
			gameState: 'WAITING',
			message: '',
			userId: '',
			creatorId: '',
			white: [],
			black: []
		};
	},
	
	componentDidMount: function () {
		socket.on('game:move', this._gameMoved);
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
		this.setState({gameState: 'START'});
	},
	
	_gameMoved: function (data) {
		this.props.move(data.from, data.to);
		if (this.props.state.in_checkmate())
			this.setState({gameState: 'LOST'});
		else if (this.props.state.in_draw() || 
				 this.props.state.in_stalemate() ||
				 this.props.state.in_threefold_repetition())
			this.setState({gameState: 'DRAWN'})
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
	
	handleMove: function (from, to) {
		socket.emit('game:move', {
			from: from,
			to: to,
			token: this.props.token,
			userId: this.state.userId
		});
		if (this.props.state.in_checkmate())
			this.setState({gameState: 'WON'});
		else if (this.props.state.in_draw() || 
				 this.props.state.in_stalemate() ||
				 this.props.state.in_threefold_repetition())
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
	
	render: function () {
		var creatorButton = <form onSubmit={this.handlePlay}><input type="submit"/></form>;
		console.log(this.state.white, this.state.black, this.getColor());
		if (this.state.gameState == 'START') {
			return (
				<div className="game">
					<h1>Share this link with your friends: {window.location.href}</h1> 
					<h1>Your current id is {this.state.userId}</h1>
					<ReactRedux.Provider store={BoardStore}>
						<Board color={this.getColor()} onMove={this.handleMove}/>
					</ReactRedux.Provider>
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

Game = ReactRedux.connect(BoardState, BoardDispatch)(Game);

module.exports = Game;