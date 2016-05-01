var React = require('react');
var DragSource = require('react-dnd').DragSource;
var DropTarget = require('react-dnd').DropTarget;

var pieceTarget = {
	drop: function (props) {
		props.onClick(props.row, props.col);
	}
};

function collectTarget (connect, monitor) {
	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver()
	};
};

var pieceSource = {
	beginDrag: function (props) {
		console.log(props.color, props.piece.color);
		if (props.color != props.piece.color) {
			props.clearPiece();
			return {};
		}
		props.onDrag(props.row, props.col);
		return {};
	},
	
	endDrag: function (props) {
		if (props.color != props.piece.color)
			return;
		props.onDrop();	
	},
};

function collectSource (connect, monitor) {
	return {
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging()
	}
};

var Piece = React.createClass({
	handleClick: function () {
		this.props.onClick(this.props.row, this.props.col);
	},
	
	render: function () {
    	var connectDropTarget = this.props.connectDropTarget;
    	var isOver = this.props.isOver
    	var connectDragSource = this.props.connectDragSource;
    	var isDragging = this.props.isDragging;
		
		return connectDropTarget(connectDragSource(
			<div 
				style={{
					top: (this.props.top) + "%",
					left: (this.props.left) + "%",
					position: 'absolute',
					width: '12.5%',
					height: '12.5%',
					opacity: isDragging ? 0.5 : 1
				}}
				onClick={this.handleClick}>
				
				<img 
					src={"../app/assets/img/" + this.props.piece.color + this.props.piece.type + ".svg"}
					className="piece"/>
			</div>
		));
	}
});

Piece = DragSource('PIECE', pieceSource, collectSource)(Piece);
Piece = DropTarget("PIECE", pieceTarget, collectTarget)(Piece);

module.exports = Piece;