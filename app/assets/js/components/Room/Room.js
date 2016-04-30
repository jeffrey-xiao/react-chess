var React = require('react');

var Room = React.createClass({
	handleTeamSubmit1: function (e) {
		e.preventDefault();
		this.props.onSubmit('team1');
	},
	
	handleTeamSubmit2: function (e) {
		e.preventDefault();
		this.props.onSubmit('team2');
	},
	
	render: function () {
		var team1 = [];
		var team2 = [];

		for (var i = 0; i < this.props.team1.length; i++)
			team1.push(<li key={this.props.team1[i].username}>{this.props.team1[i].username}</li>);
					   
		for (var i = 0; i < this.props.team2.length; i++)
			team2.push(<li key={this.props.team2[i].username}>{this.props.team2[i].username}</li>);

		return (
			<div className="room">
				{this.props.gameMode == 'BUGHOUSE' ? (<h1>Team 1</h1>) : (<h1>White</h1>)}
				<ul className="teamList">
					{team1}
				</ul>
				<form onSubmit={this.handleTeamSubmit1}>
					{this.props.gameMode == 'BUGHOUSE' ? 
						<input type="submit" value="Join Team 1"/> : 
						<input type="submit" value="Join White"/>
					}
				</form>
			
				{this.props.gameMode == 'BUGHOUSE' ? (<h1>Team 2</h1>) : (<h1>Black</h1>)}
				<ul className="teamList">
					{team2}
				</ul>
				<form onSubmit={this.handleTeamSubmit2}>
					{this.props.gameMode == 'BUGHOUSE' ? 
						<input type="submit" value="Join Team 2"/> : 
						<input type="submit" value="Join Black"/>
					}
				</form>
			</div>
		);
	}
});

module.exports = Room;