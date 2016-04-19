module.exports = function (state) {
	var fen = state.state.fen().split(" ")[0].split("/");
	var board = new Array(8);
	
	for (var i = 0; i < 8; i++)
		board[i] = new Array(8);

	var row = 0, col = 0;
	
	for (var i = fen.length - 1; i >= 0; i--) {
		for (var j = 0; j < fen[i].length; j++) {
			var val = parseInt(fen[i][j]);
			if (!isNaN(val)) {
				for (var k = 0; k < val; k++) {
					board[row][col] = '.';
					row += Math.floor((++col) / 8);
					col %= 8;
				}
			} else if (fen[i][j].toUpperCase() == fen[i][j]) {
				board[row][col] = 'w' + fen[i][j].toLowerCase();
				row += Math.floor((++col) / 8);
				col %= 8;
			} else {
				board[row][col] = 'b' + fen[i][j];
				row += Math.floor((++col) / 8);
				col %= 8;
			}
		}
	}
	
	return {
		state: state.state,
		board: board
	};
};