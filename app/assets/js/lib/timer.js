var Timer = function (time, inc, boardNum, update, callback) {
	var remainingTime = time;
	var boardNum = boardNum;
	var interval = null;
	var delta = 200;
	
	function start () {
		stop();
		interval = setInterval(function () {
			remainingTime -= delta / 1000;
			update(remainingTime, boardNum);
			if (remainingTime < delta / 1000) {
				clearInterval(interval);
				callback(boardNum);
			}
		}, delta);
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