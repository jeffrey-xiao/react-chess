var React = require('react');
var ReactRedux = require('react-redux');
var Functions = require('../../lib/functions.js');
var Modal = require('../Modal/Modal.js');
var Chat = require('../Chat/Chat.js');
var $ = require('jquery');

var GameForm = React.createClass({
	getInitialState: function () {
		return {
			message: '',
			time: '0/30/0',
			inc: '0/0/0',
			teamSize: 1
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
		
		var timeTokens = this.state.time.split('/');
		var incTokens = this.state.inc.split('/');
		
		if (timeTokens.length != 3) {
			this.setState({message: 'Please format your time as follows: (hours/minutes/seconds)'});
			return;
		}
		
		if (!(Functions.isInt(timeTokens[0]) && Functions.isInt(timeTokens[1]) && Functions.isInt(timeTokens[2]))) {
			this.setState({message: 'All time values must be numbers'});
			return;
		}
		
		if (incTokens.length != 3) {
			this.setState({message: 'Please format your increment as follows: (hours/minutes/seconds)'});
			return;
		}
		
		if (!(Functions.isInt(incTokens[0]) && Functions.isInt(incTokens[1]) && Functions.isInt(incTokens[2]))) {
			this.setState({message: 'All increment values must be numbers'});
			return;
		}
		
		if (this.state.teamSize < 1 || this.state.teamSize > 5) {
			this.setState({message: 'Time size must be between 1 and 5 inclusive'});
			return;
		}
		
		var token = Functions.toBase64(new Date().getTime().toString());
		
		var time = Functions.toInt(timeTokens[0]) * 60 * 60 + Functions.toInt(timeTokens[1]) * 60 + Functions.toInt(timeTokens[2]);
		var inc = Functions.toInt(incTokens[0]) * 60 * 60 + Functions.toInt(incTokens[1]) * 60 + Functions.toInt(incTokens[2]);
		
		socket.emit('room:create', {
			token: token,
			time: time,
			inc: inc,
			teamSize: this.state.teamSize
		});

		this.setState({message: ''});
	},
	
	handleTimeChange: function (e) {
		this.setState({time: e.target.value});	
	},
	
	handleIncChange: function (e) {
		this.setState({inc: e.target.value});	
	},
	
	handleTeamSizeChange: function (e) {
		this.setState({teamSize: e.target.value});	
	},
	
	clearMessage: function () {
		this.setState({message: ''});
	},
	
	render: function () {
		return (
			<div>
				Time (hours/minutes/seconds): 
				<input 
					type="text" 
					name="time" 
					onChange={this.handleTimeChange}
					value={this.state.time}/>
				<br/>
				
				Increment (hours/minutes/seconds): 
				<input 
					type="text" 
					name="inc" 
					onChange={this.handleIncChange}
					value={this.state.inc}/>
				<br/>
				
				Team Size (max 5): 
				<input 
					type="number" 
					min="1"
					max="5"
					name="teamsize" 
					onChange={this.handleTeamSizeChange}
					value={this.state.teamSize}/>
				<br/>
				
				<form onSubmit={this.handleSubmit}>	
					<input type="submit"></input>
				</form>
				<Modal 
					message={this.state.message}
					onSubmit={this.clearMessage}/>
			</div>
		);
	}
});

module.exports = GameForm;