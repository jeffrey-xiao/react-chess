var React = require('react');
var Functions = require('../../lib/functions');

var Clock = React.createClass({
	render: function () {

		var whiteTime, blackTime;
		
		if (this.props.gameMode == 'BUGHOUSE') {
			if (this.props.boardNum == 0) {
				whiteTime = Functions.getTime(this.props.teamTimers1);
				blackTime = Functions.getTime(this.props.teamTimers2);
			} else {
				whiteTime = Functions.getTime(this.props.teamTimers2);
				blackTime = Functions.getTime(this.props.teamTimers1);
			}
		} else {
			whiteTime = Functions.getTime(this.props.teamTimers1);
			blackTime = Functions.getTime(this.props.teamTimers2);
		}
		
		return (
			<div className="clock">
				<div className={"white-time " + (this.props.turn == 'w' ? 'active' : '')}>
					{whiteTime}
				</div>
				<div className={"black-time " + (this.props.turn == 'b' ? 'active' : '')}>
					{blackTime}
				</div>
			</div>
		);
	}
});

module.exports = Clock;