var React = require('react');
var ReactDOM = require('react-dom');
var marked = require('marked');
var Redux = require('redux');
var ReactRedux = require('react-redux');
var $ = require('jquery');
var Chess = require('./chess.min.js').Chess;

var initialState = {
	state: new Chess(),
	board: [[]],
	move: 'w'
}

var reducer = function (state, action) {
	if (state == null)
		return initialState;
	
	var newState = Object.assign({}, state);
	
	switch (action.type) {
		case 'change_square':
			newState.state.move({from: action.from, to: action.to});
			break;
	}
	return newState;
}

var store = Redux.createStore(reducer, initialState);



var BoardDispatch = function (dispatch) {
	return {
		change_square: function (from, to) {
			dispatch({
				type: 'change_square',
				from: from,
				to: to
			});
		}
	}
}

var BoardState = function (state) {
	var fen = state.state.fen().split(" ")[0].split("/");
	var move = state.state.fen().split(" ")[1];
	var board = new Array(8);
	for (var i = 0; i < 8; i++)
		board[i] = new Array(8);

	var row = 0, col = 0;
	for (var i = fen.length - 1; i >= 0; i--) {
		for (var j = 0; j < fen[i].length; j++) {
			var val = parseInt(fen[i][j]);
			if (!isNaN(val)) {
				for (var k = 0; k < val; k++) {
					board[row][col] = '.';
					row += Math.floor((++col) / 8);
					col %= 8;
				}
			} else if (fen[i][j].toUpperCase() == fen[i][j]) {
				board[row][col] = 'w' + fen[i][j].toLowerCase();
				row += Math.floor((++col) / 8);
				col %= 8;
			} else {
				board[row][col] = 'b' + fen[i][j];
				row += Math.floor((++col) / 8);
				col %= 8;
			}
		}
	}
	
	return {
		state: state.state,
		board: board,
		move: move
	}
}

var Square = React.createClass({
	getInitialState: function () {
		return {
			color: (this.props.row + this.props.col + 1) % 2
		}
	},
	
	handleClick: function () {
		this.props.onClick(this.props.row, this.props.col);
	},
	
	render: function () {
		return (
			<div 
				className={"square" + 
					(this.state.color == 0 ? " white" : " black") + 
					(this.props.active ? " active" : "") + 
					(this.props.possible ? " possible" : "")} 
				onClick={this.handleClick}>
				{this.props.piece == '.' ? null : (<img src={"assets/img/" + this.props.piece + ".svg"}/>)}
			</div>
		);
	}
});

function toCode (row, col) {
	return String.fromCharCode(col + 97) + "" + (row + 1);
}

var Board = React.createClass({
	getInitialState: function () {
		return {
			activeRow: -1,
			activeCol: -1
		}
	},
	
	handleClick: function (row, col) {
		if (this.state.activeRow == -1) {
			if (this.props.board[row][col] != '.' && this.props.board[row][col][0] == this.props.move)
				this.setState({activeRow: row, activeCol: col});
		} else if (this.props.board[this.state.activeRow][this.state.activeCol][0] == this.props.board[row][col][0]) {
			this.setState({activeRow: row, activeCol: col});
		} else {
			var from = toCode(this.state.activeRow, this.state.activeCol);
			var to = toCode(row, col);
			this.props.change_square(from, to);
			this.setState({activeRow: -1, activeCol: -1});
		}
	},
	
	render: function () {
		var children = [];
		// if white on bottom
		var validMoves = this.props.state.moves({square: toCode(this.state.activeRow, this.state.activeCol), verbose: true});
		var validSquares = []; 
		for (var i = 0; i < validMoves.length; i++)
			validSquares.push(validMoves[i].to);
		if (this.props.move == 'w') {
			for (var row = 7; row >= 0; row--) 
				for (var col = 0; col < 8; col++)
					children.push(<Square 
									row={row}
									col={col}
									active={row == this.state.activeRow && col == this.state.activeCol}
									possible={validSquares.indexOf(toCode(row, col)) > -1}
									piece={this.props.board[row][col]} 
									key={row * 8 + col}
									onClick={this.handleClick}>
								  </Square>);
		} else {
			for (var row = 0; row < 8; row++) 
				for (var col = 7; col >= 0; col--)
					children.push(<Square 
									row={row}
									col={col}
									active={row == this.state.activeRow && col == this.state.activeCol}
									possible={validSquares.indexOf(toCode(row, col)) > -1}
									piece={this.props.board[row][col]} 
									key={row * 8 + col}
									onClick={this.handleClick}>
								  </Square>);
		}
		return (
			<div className="board">
				{children}
							  {validSquares}
			</div>
		);
	}
});

Board = ReactRedux.connect(BoardState, BoardDispatch)(Board);

ReactDOM.render(
	<ReactRedux.Provider store={store}>
		<Board/>
	</ReactRedux.Provider>,
	document.getElementById('content')
);