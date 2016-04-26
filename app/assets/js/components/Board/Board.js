var Square = require('../Square/Square.js');
var PieceSupply = require('../PieceSupply/PieceSupply.js');
var Functions = require('../../lib/functions.js');
var Chess = require('../../lib/chess.min.js');
var React = require('react');

var Board = React.createClass({
	getInitialState: function () {
		return {
			activeRow: -1,
			activeCol: -1,
			activePiece: ''
		}
	},
	
	forceTurn: function (chess, color) {
		var tokens = chess.fen().split(" ");
		tokens[1] = color;
		chess.load(tokens.join(" "));
		return chess;
	},
  
	isValidPlace: function (row, col, piece, color) {
		var board = new Chess(this.props.board.fen());
		var square = Functions.toCode(row, col);

		// not current turn
		if (board.turn() != color)
			return false;
		
		// cannot place on an occupied square
		if (board.get(square) != null)
			return false;
		
		// cannot place pawn on 1st/8th rank
		if (piece == 'p' && (row == 0 || row == 7))
			return false;
	
		// cannot drop mate
		board.put({type: this.state.activePiece, color: this.props.color}, square, false);
		board = this.forceTurn(board, this.props.color == 'w' ? 'b' : 'w');
		if (board.in_checkmate()) {
			return false;
		}
		
		// cannot drop and still be in check
		board = this.forceTurn(board, this.props.color);
		if (board.in_check()) {
			return false;
		}
		
		return true;
	},
	
	handleSquareClick: function (row, col) {
		if (this.props.gameState != 'START')
			return;
		
		var activePos = Functions.toCode(this.state.activeRow, this.state.activeCol);
		var currPos = Functions.toCode(row, col);
		
		var activeSquare = this.props.board.get(activePos);
		var currSquare = this.props.board.get(currPos);

		if (this.state.activePiece != '') {
			if (this.isValidPlace(row, col, this.state.activePiece, this.props.color))
				this.props.onMove(null, null, this.state.activePiece, currPos, this.props.color);
			this.setState({activePiece: ''});
		} else {
			if (this.state.activeRow == -1) {
				if (currSquare != null && currSquare.color == this.props.color)
					this.setState({activeRow: row, activeCol: col, activePiece: ''});
			} else if (activeSquare != null && currSquare != null && activeSquare.color == currSquare.color) {
				if (row == this.state.activeRow && col == this.state.activeCol) {
					this.setState({activeRow: -1, activeCol: -1});
				} else {
					this.setState({activeRow: row, activeCol: col, activePiece: ''});
				}
			} else {
				var validSquares = [];
				var validMoves = this.props.board.moves({square: activePos, verbose: true});
				for (var i = 0; i < validMoves.length; i++)
					validSquares.push(validMoves[i].to);
				
				if (validSquares.indexOf(currPos) > -1)
					this.props.onMove(activePos, currPos, null, null, this.props.color);
				this.setState({activeRow: -1, activeCol: -1});
			}
		}
	},
	
	handleSupplyClick: function (piece) {
		if (this.props.gameState != 'START')
			return;
		
		if (this.state.activePiece == piece) {
			this.setState({activePiece: ''});
		} else {
			this.setState({activeRow: -1, activeCol: -1, activePiece: piece});
		}
	},

	render: function () {
		var children = [];

		var validSquares = []; 
		if (this.state.activeRow != -1 && this.state.activeRow != -1) {
			var validMoves = this.props.board.moves({square: Functions.toCode(this.state.activeRow, this.state.activeCol), verbose: true});
			for (var i = 0; i < validMoves.length; i++)
				validSquares.push(validMoves[i].to);
		} else if (this.state.activePiece != '') {
			for (var row = 0; row < 8; row++)
				for (var col = 0; col < 8; col++)
					if (this.isValidPlace(row, col, this.state.activePiece, this.props.color))
						validSquares.push(Functions.toCode(row, col));
		}

		if (this.props.color == 'w') {
			for (var row = 7; row >= 0; row--) 
				for (var col = 0; col < 8; col++)
					children.push(<Square 
									row={row}
									col={col}
									active={row == this.state.activeRow && col == this.state.activeCol}
									possible={validSquares.indexOf(Functions.toCode(row, col)) > -1}
									piece={this.props.board.get(Functions.toCode(row, col))} 
									key={row * 8 + col}
									onClick={this.handleSquareClick}>
								  </Square>);
		} else {
			for (var row = 0; row < 8; row++) 
				for (var col = 7; col >= 0; col--)
					children.push(<Square 
									row={row}
									col={col}
									active={row == this.state.activeRow && col == this.state.activeCol}
									possible={validSquares.indexOf(Functions.toCode(row, col)) > -1}
									piece={this.props.board.get(Functions.toCode(row, col))} 
									key={row * 8 + col}
									onClick={this.handleSquareClick}>
								  </Square>);
		}
		return (
			<div className="game-board">
				<PieceSupply 
					color={this.props.color == 'w' ? 'b' : 'w'} 
					currColor={this.props.color} 
					pieces={this.props.pieces[this.props.color == 'w' ? 'b' : 'w']}
					activePiece={this.state.activePiece}
					onClick={this.handleSupplyClick}/>
				<div className="board">
					{children}
					<div className="clear"></div>
				</div>
				<PieceSupply 
					color={this.props.color} 
					currColor={this.props.color}
					activePiece={this.state.activePiece}
					pieces={this.props.pieces[this.props.color]}
					onClick={this.handleSupplyClick}/>
			</div>
		);
	}
});
		
module.exports = Board;