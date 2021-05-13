var IO = {
    init: function() {
        IO.socket = io.connect();
        IO.bindEvents();
    },

    bindEvents: function() {
        IO.socket.on('connected', IO.onConnected );
        IO.socket.on('lobbyCreated', IO.onLobbyCreated);
        IO.socket.on('playerJoinedRoom', IO.onPLayerJoinedRoom);
        IO.socket.on('beginGame', IO.onBeginGame);
        IO.socket.on('startRound', IO.onStartRound);
        IO.socket.on('error', IO.error);
    },

    onConnected : function(data) {
        // Cache a copy of the client's socket.IO session ID on the App
        App.mySocketId = IO.socket.sessionid;
        console.log(data.message);
    },

    onLobbyCreated : function(data) {
        App.Host.gameInit(data);
    },

    onPLayerJoinedRoom : function(data){
        App[App.myRole].updateWaitingScreen(data);
    },

    onBeginGame : function(data) {
        App[App.myRole].startGame(data);
    },

    onStartRound : function(data) {
        App[App.myRole].startRound(data);
    },

    error : function(data) {
        alert(data.message);
    }

};

var App = {

    gameId : 0,
    myRole: '',
    mySocketId: '',

    init: function() {
        App.cacheElements();
        App.paginaInicial();
        App.bindEvents();
    },

    cacheElements : function() {
        App.$doc = $(document);

        App.$gameArea = $('#gameArea');
        App.$paginaInicial = $('#homepage-template').html();
        App.$lobby = $('#new-game-template').html();
        App.$joinLobby = $('#join-game-template').html();
        App.$waitScreen = $('#begin-template').html();
        App.$choseWord = $('#choose-word-template').html();
        App.$playScreen = $('#play-screen').html();
        App.$guessScreen = $('#player-guess-template').html();
        App.$hostGame = $('#guess-word-template').html();
    },

    paginaInicial : function() {
        App.$gameArea.html(App.$paginaInicial);
    },

    bindEvents: function() {
        App.$doc.on('click', '#btnNewLobby', App.Host.onCreateClick);
        App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
        App.$doc.on('click', '#btnJoin', App.Player.onPlayerStartClick);
        App.$doc.on('click', '.btnEscolha', App.Player.onEscolha);
    },

    Host : {
        players: [],
        numPlayersInRoom: 0,
        isNewGame: false,
        currentPlayer: 1,

        onCreateClick : function() {
            IO.socket.emit('hostCreateLobby');
        },

        gameInit : function(data) {
            App.gameId = data.gameId;
            App.mySocketId = data.mySocketId;
            App.myRole = 'Host';
            App.Host.numPlayersInRoom = 0;

            App.Host.displayLobbyScreen();
        },

        displayLobbyScreen : function() {
            App.$gameArea.html(App.$lobby);

            $('#gameURL').text(window.location.href);
            $('#lobbyNum').text(App.gameId);
        },

        updateWaitingScreen : function(data) {
            if ( App.Host.isNewGame ) {
                App.Host.displayLobbyScreen();
            }
            
            $('#tableUsers')
                .append('<p/>')
                .text('Player ' + data.playerName + ' joined the game.');

            App.Host.players.push(data);
            App.Host.numPlayersInRoom += 1;

            if(App.Host.numPlayersInRoom === 2) {
                dados = { 
                    gameId : App.gameId,
                    playerAtual : App.Host.players[App.Host.currentPlayer]
                };
                IO.socket.emit('roomFull', dados);
            }
        },

        startGame : function(data) {
            console.log(data);
            App.$gameArea.html(App.$waitScreen);
        },

        startRound : function(data) {
            App.$gameArea.html(App.$hostGame);
        }
    },

    Player : {

        myName : '',

        onJoinClick : function() {
            App.$gameArea.html(App.$joinLobby);
        },

        onPlayerStartClick : function() {
            var data = {
                gameId : +($('#inputLobbyNum').val()),
                playerName : $('#inputPlayerName').val()
            };

            //console.log(data.gameId);

            IO.socket.emit('playerJoinGame', data);

            App.myRole = 'Player';
            App.Player.myName = data.playerName;
        },

        updateWaitingScreen : function(data) {
            if(IO.socket.sessionid === data.mySocketId){
                App.myRole = 'Player';
                App.gameId = data.gameId;
                //console.log(data.gameId);
                //console.log(data.mySocketId);

                $('#playerWaitingMessage')
                    .append('<p/>')
                    .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
            }

            //console.log(data.playerName);
        },

        startGame : function(data) {
            console.log(data);

            if(App.Player.myName === data.playerAtual.playerName){
                App.$gameArea.html(App.$choseWord);
                $('#btnGetWord1').text(data.words[0]);
                $('#btnGetWord2').text(data.words[1]);
                $('#btnGetWord3').text(data.words[2]);
            }
            else {
                App.$gameArea.html(App.$waitScreen);
            }
        },

        onEscolha : function() {
            var $btn = $(this);
            var escolha = $btn.text();

            var data = {
                gameId: App.gameId,
                playerId: App.mySocketId,
                playerName: App.Player.myName,
                escolha: escolha
            };

            IO.socket.emit('playerEscolha', data);
        },

        startRound: function(data) {
            if(App.Player.myName === data.playerName){
                App.$gameArea.html(App.$playScreen);
                $('#word').text(data.escolha);
                console.log(data.escolha);
                App.Player.desenhar();
            }
            else {
                App.$gameArea.html(App.$guessScreen);
            }
        },

        desenhar : function() {
            document.addEventListener("DOMContentLoaded", function() {
                var mouse = {
                    click : false,
                    move : false,
                    pos : {x:0, y:0},
                    pos_prev: false
                };

                var canvas = document.getElementById('drawCanvas');
                var context = canvas.getContext('2d');

                canvas.onmousedown = function(e){ mouse.click = true; };
                canvas.onmouseup = function(e){ mouse.click = false; };

                canvas.onmousemove = function(e){
                    mouse.pos.x = e.clientX;
                    mouse.pos.y = e.clientY;
                    mouse.move = true;
                };
                

            });
        }
    }
};

IO.init();
App.init();