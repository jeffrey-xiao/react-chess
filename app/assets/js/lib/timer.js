var Timer = function (time, inc, boardNum, update, callback) {
	var remainingTime = time;
	var boardNum = boardNum;
	var interval = null;
	
	function start () {
		stop();
		interval = setInterval(function () {
			remainingTime -= 1.0;
			update(remainingTime, boardNum);
			if (remainingTime < 0.1) {
				clearInterval(interval);
				callback(boardNum);
			}
		}, 1000);
	};
	
	function stop () {
		if (interval != null) {
			clearInterval(interval);
			interval = null;
			remainingTime += inc;
			update(remainingTime, boardNum);
		}
	};
	
	
	return {
		start: function () {
			start();
		},
		
		stop: function () {
			stop();
		}
	}
}

module.exports = Timer;