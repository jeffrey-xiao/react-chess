var React = require('react');
var SupplyPiece = require('../Piece/SupplyPiece');

var pieceNames = ['q', 'r', 'b', 'n', 'p'];

module.exports = React.createClass({
	
	handleClick: function (piece, pieceCount) {
		if (this.props.currColor == this.props.color && pieceCount > 0) {
			this.props.onClick(piece);
		} else {
			this.props.clearPiece();
		}
	},
	
	handleDrag: function (piece, pieceCount) {
		if (this.props.currColor == this.props.color && pieceCount > 0) {
			this.props.onDrag(piece);
		} else {
			this.props.clearPiece();
		}
	},
	
	handleDrop: function (piece, pieceCount) {
		if (this.props.currColor == this.props.color && pieceCount > 0) {
			this.props.onDrop(piece);
		} else {
			this.props.clearPiece();
		}
	},
	
	render: function () {
		
		var children = [];
		for (var i = 0; i < pieceNames.length; i++) {
			children.push(
				<div 
					className={"pieceSupply " + (this.props.color == this.props.currColor && pieceNames[i] == this.props.activePiece ? 'active' : '')}
					key={this.props.color + pieceNames[i]}
					onClick={this.handleClick.bind(this, pieceNames[i], this.props.pieces[pieceNames[i]])}>
					<SupplyPiece 
						color={this.props.color} 
						pieceName={pieceNames[i]}
						onDrag={this.handleDrag.bind(this, pieceNames[i], this.props.pieces[pieceNames[i]])}
						onDrop={this.handleDrop.bind(this, pieceNames[i], this.props.pieces[pieceNames[i]])}/>
					<div className="pieceSupplyCount">{this.props.pieces[pieceNames[i]]}</div>
				</div>
			);
		}
		
		return (
			<div className="pieceSupplies">
				{children}
				<div className="clear"></div>
			</div>
		);
	}
});