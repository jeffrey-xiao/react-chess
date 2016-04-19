module.exports = function (dispatch) {
	return {
		move: function (from, to) {
			dispatch({
				type: 'MOVE',
				from: from,
				to: to
			});
		},
		setBoard: function (fen) {
			dispatch({
				type: 'SET_BOARD',
				fen: fen
			});
		}
	}
};