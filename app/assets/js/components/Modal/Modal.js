var React = require('react');

var Modal = React.createClass({
	handleClick: function (e) {
		e.preventDefault();
		this.props.onSubmit();
	},
	
	render: function () {
		return (
			<div className={"modal " + (this.props.message == '' ? 'active' :'')}>
				<div className="modal-mask"></div>
				<div className="modal-box">
					<div className="modal-message">
						{this.props.message}
					</div>
					<button className="button" type="button" onClick={this.handleClick}>OK</button>
				</div>
			</div>
		);
	}
});

module.exports = Modal;