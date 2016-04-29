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
			teamSize: 1,
			gameMode: 'NORMAL'
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
		
		var token = Functions.toBase64(new Date().getTime().toString());
		
		var time = Functions.toInt(timeTokens[0]) * 60 * 60 + Functions.toInt(timeTokens[1]) * 60 + Functions.toInt(timeTokens[2]);
		var inc = Functions.toInt(incTokens[0]) * 60 * 60 + Functions.toInt(incTokens[1]) * 60 + Functions.toInt(incTokens[2]);
		
		socket.emit('room:create', {
			token: token,
			time: time,
			inc: inc,
			teamSize: this.state.teamSize,
			gameMode: this.state.gameMode
		});

		this.setState({message: ''});
	},
	
	handleTimeChange: function (e) {
		this.setState({time: e.target.value});	
	},
	
	handleIncChange: function (e) {
		this.setState({inc: e.target.value});	
	},
	
	handleTeamSizeChange: function (val) {
		if (this.state.gameMode == 'BUGHOUSE' && val != 2) {
			this.setState({message: "Bughouse can only be played with team sizes of two!"});
		} else {
			this.setState({teamSize: val});	
		}
	},
	
	handleGameModeChange: function (val) {
		this.setState({gameMode: val});
		if (val == "BUGHOUSE")
			this.setState({teamSize: 2});
	},
	
	clearMessage: function () {
		this.setState({message: ''});
	},
	
	render: function () {
		return (
			<div>
				<form onSubmit={this.handleSubmit}>	
					<div className="form-label">Time (h/m/s)</div>
					<input 
						type="text" 
						name="time" 
						onChange={this.handleTimeChange}
						value={this.state.time}/>
					<br/>

					<div className="form-label">Increment (h/m/s)</div>
					<input 
						type="text" 
						name="inc" 
						onChange={this.handleIncChange}
						value={this.state.inc}/>
					<br/>

					<div className="form-label">Game Mode</div>
					<div className="option-row">
						<div
							className={"option-text " + (this.state.gameMode == 'NORMAL' ? "active" : "")}
							onClick={this.handleGameModeChange.bind(this, "NORMAL")}>NORMAL</div>
						
						<div
							className={"option-text " + (this.state.gameMode == 'CRAZYHOUSE' ? "active" : "")}
							onClick={this.handleGameModeChange.bind(this, "CRAZYHOUSE")}>CRAZYHOUSE</div>
						
						<div
							className={"option-text " + (this.state.gameMode == 'BUGHOUSE' ? "active" : "")}
							onClick={this.handleGameModeChange.bind(this, "BUGHOUSE")}>BUGHOUSE</div>
					</div>
					
					<div className="form-label">Team Size</div>
					<div className="option-row">
						<div 
							className={"option-no-text " + (this.state.teamSize >= 1 ? "active" : "")} 
							onClick={this.handleTeamSizeChange.bind(this, 1)}></div>
						<div 
							className={"option-no-text " + (this.state.teamSize >= 2 ? "active" : "")} 
							onClick={this.handleTeamSizeChange.bind(this, 2)}></div>
						<div 
							className={"option-no-text " + (this.state.teamSize >= 3 ? "active" : "")} 
							onClick={this.handleTeamSizeChange.bind(this, 3)}></div>
						<div 
							className={"option-no-text " + (this.state.teamSize >= 4 ? "active" : "")} 
							onClick={this.handleTeamSizeChange.bind(this, 4)}></div>
						<div 
							className={"option-no-text " + (this.state.teamSize >= 5 ? "active" : "")} 
							onClick={this.handleTeamSizeChange.bind(this, 5)}></div>
					</div>
						
					<input type="submit" className="button" value="Create Game!"/>
				</form>
					
				<Modal 
					message={this.state.message}
					onSubmit={this.clearMessage}/>
			</div>
		);
	}
});

module.exports = GameForm;