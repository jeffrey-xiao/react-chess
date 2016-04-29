var React = require('react');

var Room = React.createClass({
	handleWhiteSubmit: function (e) {
		e.preventDefault();
		this.props.onSubmit('white');
	},
	
	handleBlackSubmit: function (e) {
		e.preventDefault();
		this.props.onSubmit('black');
	},
	
	render: function () {
		var white = [];
		var black = [];

		for (var i = 0; i < this.props.white.length; i++)
			white.push(<li key={this.props.white[i].username}>{this.props.white[i].username}</li>);
					   
		for (var i = 0; i < this.props.black.length; i++)
			black.push(<li key={this.props.black[i].username}>{this.props.black[i].username}</li>);

		return (
			<div className="room">
				<h1>White</h1>
				<ul className="teamList">
					{white}
				</ul>
				<form onSubmit={this.handleWhiteSubmit}>
					<input type="submit" value="Join White"/>	
				</form>
			
				<h1>Black</h1>
				<ul className="teamList">
					{black}
				</ul>
				<form onSubmit={this.handleBlackSubmit}>
					<input type="submit" value="Join Black"/>	
				</form>
			</div>
		);
	}
});

module.exports = Room;