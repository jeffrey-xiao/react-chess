var React = require('react');
var DropTarget = require('react-dnd').DropTarget;

var squareTarget = {
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
    	var connectDropTarget = this.props.connectDropTarget;
    	var isOver = this.props.isOver
		return connectDropTarget(
			<div 
				className={"square" + 
					(this.state.color == 0 ? " white" : " black") + 
					(this.props.active ? " active" : "") + 
					(this.props.possible ? " possible" : "") + 
					(this.props.lastSquare ? " last" : "")}
				onClick={this.handleClick}>
			</div>
		);
	}
});

module.exports = DropTarget("PIECE", squareTarget, collect)(Square);