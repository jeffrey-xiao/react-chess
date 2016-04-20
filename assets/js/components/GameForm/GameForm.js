var React = require('react');
var ReactRedux = require('react-redux');
var Functions = require('../../lib/Functions.js');
var Error = require('../Error/Error.js');

var GameForm = React.createClass({
	getInitialState: function () {
		return {
			message: ''
		}
	},

	componentDidMount: function () {
		socket.on('room:created', this._roomCreated);
	},
	
	_roomCreated: function (data) {
		window.location.href += "play/" + data.token;
	},
	
	handleSubmit: function (e) {
		e.preventDefault();
		
		var token = Functions.toBase64(new Date().getTime().toString());
		
		socket.emit('room:create', {
			token: token
		});

		this.setState({message: ''});
	},
	
	render: function () {
		return (
			<div>
				<form onSubmit={this.handleSubmit}>	
					<input type="submit"></input>
				</form>
				<Error message={this.state.message}/>
			</div>
		);
	}
});

module.exports = GameForm;