var React = require('react');
var Functions = require('../../lib/functions');

var Clock = React.createClass({
	
	
	
	render: function () {
		return (
			<div className="clock">
				<div className={"white-time " + (this.props.turn == 'w' ? 'active' : '')}>{Functions.getTime(this.props.whiteTime)}</div>
				<div className={"black-time " + (this.props.turn == 'b' ? 'active' : '')}>{Functions.getTime(this.props.blackTime)}</div>
			</div>
		);
	}
});

module.exports = Clock;