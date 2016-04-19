var express = require('express');
var http = require('http');
var morgan = require('morgan');
var firebase = require('firebase');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var firebaseRef = new Firebase("https://jeffrey-xiao-react.firebaseio.com");

var hostname = 'localhost';
var port = 8080;

var srcPath = __dirname + '/assets';
var destPath = __dirname + '/assets';

var app = express();

app.use(morgan('dev'));
app.use(sassMiddleware({
	src: srcPath,
	dest: destPath,
	debug: true,
	force: true,
	outputStyle: 'expanded'
}));

app.use("/", express.static(__dirname + '/'));

app.listen(port, hostname, function () {
	console.log("Server is running at http://" + hostname + "/" + port);
});