jQuery(function($){
    'use strict';

    var IO = {
        init: function() {
            IO.socket = io.connect();
            IO.bindevents();
        },

        bindevents : function(){
            IO.socket.on('connected', IO.onConnected);

            IO.socket.on('newGameCreated', IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newDraw', IO.newDraw);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
        },


        onConnected : function() {
            App.mySocketId = IO.socket.sessionid;
        },

        onNewGameCreated: function(data) {
            App.Host.gameInit(data);
        },

        playerJoinedRoom: function(data) {
            App[App.myRole].updateWaitingScreen(data);
        },

        beginNewGame: function(data) {
            App[App.myRole].gameCountdown(data);
        },

        newDraw: function(data) {
            App.currentRound = data.round;
        },

        hostCheckAnswer: function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        gameOver: function(data) {
            App[App.myRole].endGame(data);
        }
    };

    var App = {
        gameId: 0,
        myRole: '',
        mySocketId: '',
        currentRound: 0,

        init: function() {
            App.cacheElements();
            App.showInitScreen();
            App.bindevents();

            //FastClick.attach(document.body);
        },

        cacheElements: function() {
            App.$doc = $(document);

            App.$gameArea = $('#gameArea');
            App.$homePage = $('#homepage-template').html();
            App.$newGame = $('#new-game-template').html();
            App.$joinGame = $('#join-game-template').html();
        },

        bindevents: function() {
            App.$doc.on('click', '#btnNewLobby', App.Host.onCreateClick);
            //App.$doc.on('click', '#btnInstructions', App.Host.onInstructionsClick);
            //App.$doc.on('click', '#btnStartGame', App.Host.onStartGameClick);

            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnJoin', App.Player.onJoinLobbyClick)
        },

        showInitScreen: function() {
            App.$gameArea.html(App.$homePage);
        },

        Host : {
            players : [],
            isNewGame: false,
            numPlayersRoom: 0,
            currentCorrectAnswer: '',

            onCreateClick: function() {
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function(data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersRoom = 0;

                App.Host.displayNewGameScreen();
            },

            displayNewGameScreen: function() {
                App.$gameArea.html(App.$newGame);

                $('#gameURL').text(window.location.href);
                $('#lobbyNum').text(App.gameId);
            }

        },

        Player : {
            hostSocketId: '',
            myName: '',

            onJoinClick : function() {
                App.$gameArea.html(App.$joinGame);
            }
        }
    };

    IO.init();
    App.init();

}($));