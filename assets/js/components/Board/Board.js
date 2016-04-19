var BoardDispatch = require('./BoardDispatch.js');
var BoardState = require('./BoardState.js');
var Square = require('../Square/Square.js');
var Functions = require('../../lib/Functions.js');
var React = require('react');
var ReactRedux = require('react-redux');

var Board = React.createClass({
	getInitialState: function () {
		return {
			activeRow: -1,
			activeCol: -1
		}
	},
	
	handleClick: function (row, col) {
		if (this.state.activeRow == -1) {
			if (this.props.board[row][col] != '.' && this.props.board[row][col][0] == this.props.color)
				this.setState({activeRow: row, activeCol: col});
		} else if (this.props.board[this.state.activeRow][this.state.activeCol][0] == this.props.board[row][col][0]) {
			if (row == this.state.activeRow && col == this.state.activeCol)
				this.setState({activeRow: -1, activeCol: -1});
			else
				this.setState({activeRow: row, activeCol: col});
		} else {
			var from = Functions.toCode(this.state.activeRow, this.state.activeCol);
			var to = Functions.toCode(row, col);
			this.props.move(from, to);
			this.props.onMove(from, to);
			this.setState({activeRow: -1, activeCol: -1});
		}
	},

	render: function () {
		var children = [];
		// if white on bottom
		var validMoves = this.props.state.moves({square: Functions.toCode(this.state.activeRow, this.state.activeCol), verbose: true});
		var validSquares = []; 
		for (var i = 0; i < validMoves.length; i++)
			validSquares.push(validMoves[i].to);

		if (this.props.color == 'w') {
			for (var row = 7; row >= 0; row--) 
				for (var col = 0; col < 8; col++)
					children.push(<Square 
									row={row}
									col={col}
									active={row == this.state.activeRow && col == this.state.activeCol}
									possible={validSquares.indexOf(Functions.toCode(row, col)) > -1}
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
									possible={validSquares.indexOf(Functions.toCode(row, col)) > -1}
									piece={this.props.board[row][col]} 
									key={row * 8 + col}
									onClick={this.handleClick}>
								  </Square>);
		}
		if (this.props.gameState == 'READY') {
			return (
				<div className="board">
					{children}
					{this.props.color}
				</div>
			);
		} else {
			return (<h1>{this.props.color}</h1>);
		}
	}
});
		
Board = ReactRedux.connect(BoardState, BoardDispatch)(Board);
			
module.exports = Board;