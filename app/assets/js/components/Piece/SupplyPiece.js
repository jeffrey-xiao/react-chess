var React = require('react');
var DragSource = require('react-dnd').DragSource;

var pieceSource = {
	beginDrag: function (props) {
		props.onDrag();
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
	render: function () {
    	var connectDragSource = this.props.connectDragSource;
    	var isDragging = this.props.isDragging;
		return connectDragSource(
			<img src={"../app/assets/img/" + this.props.color + this.props.pieceName + ".svg"}/>
		);
	}
});

module.exports = DragSource('PIECE', pieceSource, collect)(Piece);