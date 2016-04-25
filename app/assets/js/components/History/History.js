var React = require('react');

var History = React.createClass({	
	render: function () {
		var children = [];
		for (var i = 0; i < this.props.history.length; i += 2) {
			children.push(
				<div className="history-row" key = {i}>
					<div className="number">{Math.floor(i / 2) + 1}</div>
					<div className="move">{this.props.history[i]}</div>
					<div className="move">{i + 1 < this.props.history.length ? this.props.history[i + 1] : '-'}</div>
				</div>
			);
		}
		return (
			<div className="history">
				<div className="history-header">Table of Moves</div>
				<div className="history-body">	
					{children}
				</div>
			</div>
		);
	}
});

module.exports = History;