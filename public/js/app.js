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

    onBeginGame : function() {
        App[App.myRole].gameCountdown(data);
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
    },

    paginaInicial : function() {
        App.$gameArea.html(App.$paginaInicial);
    },

    bindEvents: function() {
        App.$doc.on('click', '#btnNewLobby', App.Host.onCreateClick);
        App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
        App.$doc.on('click', '#btnJoin',App.Player.onPlayerStartClick);
    },

    Host : {
        players: [],
        numPlayersInRoom: 0,
        isNewGame: false,

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

            if(App.Host.numPlayersInRoom === 4) {
                IO.socket.emit('roomFull', App.gameId);
            }
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
        
        gameStart : function(data) {

        }
    }
};

IO.init();
App.init();