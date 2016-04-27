var React = require('react');
var DragSource = require('react-dnd').DragSource;

var pieceSource = {
	beginDrag: function (props) {
		props.onDrag(props.row, props.col);
		return {};
	},
	
	endDrag: function (props) {
		props.onDrop();	
	},
};

function collect (connect, monitor) {
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
    	var connectDragSource = this.props.connectDragSource;
    	var isDragging = this.props.isDragging;
		
		return connectDragSource(
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
		);
	}
});

module.exports = DragSource('PIECE', pieceSource, collect)(Piece);