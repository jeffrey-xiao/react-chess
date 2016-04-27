var React = require('react');
var DropTarget = require('react-dnd').DropTarget;

var pieceTarget = {
	drop: function (props) {
		props.onClick(props.row, props.col);
	}
};

function collect (connect, monitor) {
	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver()
	};
};

var Piece = React.createClass({
	handleClick: function () {
		this.props.onClick(this.props.row, this.props.col);
	},
	
	render: function () {
    	var connectDropTarget = this.props.connectDropTarget;
    	var isOver = this.props.isOver
		
		return connectDropTarget(
			<div 
				style={{
					top: (this.props.top) + "%",
					left: (this.props.left) + "%",
					position: 'absolute',
					width: '12.5%',
					height: '12.5%'
				}}
				onClick={this.handleClick}>
				
				<img 
					src={"../app/assets/img/" + this.props.piece.color + this.props.piece.type + ".svg"}
					className="piece"/>
			</div>
		);
	}
});

module.exports = DropTarget("PIECE", pieceTarget, collect)(Piece);