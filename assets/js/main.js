var React = require('react');
var ReactDOM = require('react-dom');
var marked = require('marked');
var Redux = require('redux');
var ReactRedux = require('react-redux');
var $ = require('jquery');
var Chess = require('./lib/chess.min.js').Chess;

var BoardStore = require('./components/Board/BoardStore.js');

var Game = require('./components/Game/Game.js');
var GameForm = require('./components/GameForm/GameForm.js');

var token = window.location.href.split('/')[4];

if (token == null)
	token = "";

if (document.getElementById('game') != null)
	ReactDOM.render(
		<ReactRedux.Provider store={BoardStore}>
			<Game token={token}/>
		</ReactRedux.Provider>,
		document.getElementById('game')
	);

if (document.getElementById('gameform') != null)
	ReactDOM.render(
		<GameForm/>,
		document.getElementById('gameform')
	);