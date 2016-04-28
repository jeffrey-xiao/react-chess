var React = require('react');

var Chat = React.createClass({
	getInitialState: function () {
		return {
			message: ''			
		};
	},
	
	handleMessageChange: function (e) {
		this.setState({message: e.target.value});	
	},
	
	handleKeyDown: function (e) {
		if (e.keyCode == 13) {
			if (this.state.message != '')
				this.props.onSubmit(this.state.message);
			this.setState({message: ''});	
		}
	},
	
	render: function () {
		var messages = [];
		
		for (var i = 0; i < this.props.messages.length; i++)
			messages.push(
				<li key={i} className={"message " + (this.props.username == this.props.messages[i].author ? "active" : "")}>
					<div className="message-author">
						{this.props.messages[i].author}
					</div>
					<div className="message-time">
						{this.props.messages[i].time}
					</div>
					<div className="message-body">
						{this.props.messages[i].body}
					</div>
				</li>
			);
		
		return (
			<div className="chat">
				<div className="chat-header">Chat Room</div>
				<ul className="messages">
					{messages}
				</ul>
				<input 
					className="message-form"
					type="text"
					value={this.state.message}
					onChange={this.handleMessageChange}
					onKeyDown={this.handleKeyDown}
					placeholder="Press enter to submit!"/>
			</div>
		);
	}
});

module.exports = Chat;