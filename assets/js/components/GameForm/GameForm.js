var React = require('react');
var ReactRedux = require('react-redux');
var Functions = require('../../lib/Functions.js');
var Error = require('../Error/Error.js');

var GameForm = React.createClass({
	getInitialState: function () {
		return {
			color: '',
			message: '',
			link: ''
		}
	},

	componentDidMount: function () {
		socket.on('room:created', this._roomCreated);
		socket.on('room:ready', this._roomReady);
	},
	
	_roomCreated: function (data) {
		this.setState({link: window.location.href + "play/" + data.token});
	},
	
	_roomReady: function (data) {
		console.log("THE ROOM IS READY");
		window.location.href += "play/" + data.token;
	},
	
	handleChange: function (e) {
		this.setState({color: e.currentTarget.value});
	},
	
	handleSubmit: function (e) {
		e.preventDefault();
		if (this.state.color == '') {
			this.setState({message: 'Please select an option'});
			return;
		}
		
		var token = Functions.toBase64(new Date().getTime().toString());
		var userColor = this.state.color;
		
		if (userColor == 'r')
			userColor = Math.random() > 0.5 ? 'w' : 'b';
		
		socket.emit('room:create', {
			token: token,
			userColor: userColor
		});

		this.setState({message: '', color: ''});
	},
	
	render: function () {
		return (
			<div>
				<h1>hi</h1>
				<form onSubmit={this.handleSubmit}>	
					<input 
						type="radio" 
						name="color" 
						value="w"
						id="w"
						checked={this.state.color === 'w'}
						onChange={this.handleChange}></input>
					<label htmlFor="w">White</label>
					<input 
						type="radio" 
						name="color" 
						value="b" 
						id="b"
						checked={this.state.color === 'b'}
						onChange={this.handleChange}></input>
					<label htmlFor="w">Black</label>
					<input 
						type="radio" 
						name="color" 
						value="r" 
						id="r"
						checked={this.state.color === 'r'}
						onChange={this.handleChange}></input>
					<label htmlFor="w">Random</label>
					<input type="submit"></input>
				</form>
				{this.state.link}
				<Error message={this.state.message}/>
			</div>
		);
	}
});

module.exports = GameForm;