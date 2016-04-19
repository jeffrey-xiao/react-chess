var React = require('react');

module.exports = React.createClass({
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
				{this.props.piece == '.' ? null : (<img src={"../assets/img/" + this.props.piece + ".svg"}/>)}
			</div>
		);
	}
});