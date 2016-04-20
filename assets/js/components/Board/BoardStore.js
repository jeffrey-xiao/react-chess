var Chess = require('../../../../chess.min.js').Chess;
var Redux = require('redux');

var initialState = {
	state: new Chess(),
	board: [[]]
};

var reducer = function (state, action) {
	if (state == null)
		return initialState;
	
	var newState = Object.assign({}, state);
	
	switch (action.type) {
		case 'MOVE':
			newState.state.move({from: action.from, to: action.to, promotion: 'q'});
			break;
		case 'SET_BOARD':
			newState.state = new Chess(action.fen);
			break;
	}
	return newState;
};

module.exports = Redux.createStore(reducer, initialState);