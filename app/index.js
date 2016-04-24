var React = require('react');
var ReactDOM = require('react-dom');
var marked = require('marked');
var Redux = require('redux');
var ReactRedux = require('react-redux');
var $ = require('jquery');
var Chess = require('./assets/js/lib/chess.min.js').Chess;

var Game = require('./assets/js/components/Game/Game.js');
var GameForm = require('./assets/js/components/GameForm/GameForm.js');
var PieceSupply = require('./assets/js/components/PieceSupply/PieceSupply.js');

var token = window.location.href.split('/')[4];

if (token == null)
	token = "";

if (document.getElementById('pieceSupply') != null)
	ReactDOM.render(
		<PieceSupply color={'w'} pieces={{'q':0, 'r':0, 'n':0, 'b':0, 'p':0}}/>,
		document.getElementById('pieceSupply')
	);

if (document.getElementById('game') != null)
	ReactDOM.render(
		<Game token={token}/>,
		document.getElementById('game')
	);

if (document.getElementById('gameform') != null)
	ReactDOM.render(
		<GameForm/>,
		document.getElementById('gameform')
	);