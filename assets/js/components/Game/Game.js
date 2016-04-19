var Board = require('../Board/Board.js');
var BoardDispatch = require('../Board/BoardDispatch.js');
var BoardStore = require('../Board/BoardStore.js');
var BoardState = require('../Board/BoardState.js');
var React = require('react');
var ReactRedux = require('react-redux');

var Game = React.createClass({
	getInitialState: function () {
		return {
			gameState: 'WAITING',
			color: ''
		};
	},
	
	componentDidMount: function () {
		socket.on('game:move', this._gameMoved);
		socket.on('token:invalid', this._tokenInvalid);
		socket.on('room:full', this._roomFull);
		socket.on('room:join', this._roomJoin);
		socket.on('room:start', this._roomStart);
		
		socket.on('test', function () {
			console.log('test');
		});
		
		socket.emit('room:join', {
			token: this.props.token
		});
	},
	
	_gameMoved: function (data) {
		console.log("GAME MOVED", data);
		this.props.move(data.from, data.to);
	},
	
	_tokenInvalid: function () {
		console.log("THIS TOKEN IS INVALID");
	},
	
	_roomFull: function () {
		console.log("THIS ROOM IS FULL");
	},
	
	_roomJoin: function (data) {
		this.setState({color: data.color})
	},
	
	_roomStart: function () {
		this.setState({gameState: 'READY'});
	},
	
	handleMove: function (from, to) {
		socket.emit('game:move', {
			from: from,
			to: to,
			token: this.props.token
		});
	},
	
	render: function () {
		return (
			<ReactRedux.Provider store={BoardStore}>
				<Board color={this.state.color} gameState={this.state.gameState} onMove={this.handleMove}/>
			</ReactRedux.Provider>
		);
	}
});

Game = ReactRedux.connect(BoardState, BoardDispatch)(Game);

module.exports = Game;