var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-_",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

function padZero (num, places) {
	var zero = places - num.toString().length + 1;
  	return Array(+(zero > 0 && zero)).join("0") + num;
};

function toCode (row, col) {
	return String.fromCharCode(col + 97) + "" + (row + 1);
};

module.exports = {
	toCode: function (row, col) {
		return String.fromCharCode(col + 97) + "" + (row + 1); 
	},
	
	toBase64: function (str) {
		return Base64.encode(str);
	},
	
	toInt: function (value) {
		return parseInt(Number(value));
	},
	
	isInt: function (value) {
  		return !isNaN(value) && 
				parseInt(Number(value)) == value && 
				!isNaN(parseInt(value, 10));
	},
	
	getTime: function (time) {
		var hours = Math.floor(time / 60 / 60);
		time -= hours * 60 * 60;
		var minutes = Math.floor(time / 60);
		time -= minutes * 60;
		var seconds = Math.floor(time);
		time -= seconds;

		if (hours != 0)
			return hours + ":" + padZero(minutes, 2);
		else if (minutes != 0)
			return minutes + ":" + padZero(seconds, 2);
		return seconds + "." + Math.floor(time * 10);
	},
	
	padZero: padZero,
	
	isCheckmate: function (board, pieces, color) {
		console.log(pieces, color);
		var hasPawn = pieces[color]['p'] > 0;
		var hasOther = pieces[color]['n'] + pieces[color]['b'] + pieces[color]['r'] + pieces[color]['q'] > 0;
		
		if (!board.in_checkmate())
			return false;
		
		for (var row = 0; row < 8; row++) {
			for (var col = 0; col < 8; col++) {
				var square = toCode(row, col);
				if (board.get(square) == null && (hasOther || (row != 0 && row != 7 && hasPawn))) {
					board.put({
						type: 'p',
						color: color
					}, square);
					
					if (!board.in_check())
						return false;
					
					board.remove(square);
				}
			}
		}
		
		return true;
	},
	
	isDrawn: function (board, pieces, color) {
		var hasPieces = pieces[color]['n'] + pieces[color]['b'] + pieces[color]['r'] + pieces[color]['q'] + pieces[color]['p'] > 0;
		if (board.in_draw() && !hasPieces)
			return true;
		return false;
	}
};