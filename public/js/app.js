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
        IO.socket.on('onDrawLine', IO.onDrawLine);
        IO.socket.on('error', IO.error);
        IO.socket.on('proximaRonda', IO.onProximaRonda);
        IO.socket.on('acabarJogo', IO.onAcabarJogo);
    },

    onConnected : function(data) {
        // Cache a copy of the client's socket.IO session ID on the App
        App.mySocketId = IO.socket.sessionid;
        //console.log(data.message);
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

    onDrawLine : function(data){
        App.Player.drawLine(data);
    },

    onProximaRonda : function(){
        App[App.myRole].proximaRonda();
    },

    onAcabarJogo : function () {
        App[App.myRole].acabarJogo();
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
        App.$doc.on('click', '#btnGuessWord', App.Player.adivinhaPalavra);
    },

    Host : {
        players: [],
        numPlayersInRoom: 0,
        isNewGame: false,
        currentPlayer: 0,
        ronda: 0,

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
            if(App.Host.numPlayersInRoom === 3) {
                dados = { 
                    gameId : App.gameId,
                    playerAtual : App.Host.players[App.Host.currentPlayer]
                };
                IO.socket.emit('startRound', dados);
            }
        },

        startGame : function() {
            App.$gameArea.html(App.$waitScreen);
        },

        startRound : function() {
            App.$gameArea.html(App.$hostGame);
            this.desenha();
        },

        desenha : function() {

            const canvas = document.getElementById("guessCanvas");
            const ctx = canvas.getContext("2d");
            const div = document.getElementById("left");

            ctx.canvas.width = div.offsetWidth;
            ctx.canvas.height = div.offsetHeight;

            IO.socket.on('drawLine', function(data) {
                ctx.beginPath();
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.strokeStyle = data.cor;
                ctx.moveTo(data.linha.ponto1.x * div.offsetWidth, data.linha.ponto1.y * div.offsetHeight);
                ctx.lineTo(data.linha.ponto2.x * div.offsetWidth, data.linha.ponto2.y * div.offsetHeight);
                ctx.stroke();
            });
        },

        proximaRonda : function(){
            if(App.Host.ronda === 3){
                IO.socket.emit('acabarJogo');
            }
            if(App.Host.currentPlayer === 2){
                console.log("ronda: ", App.Host.ronda);
                App.Host.currentPlayer = 0;
                App.Host.ronda += 1;
                dados = { 
                    gameId : App.gameId,
                    playerAtual : App.Host.players[App.Host.currentPlayer]
                };
                IO.socket.emit('startRound', dados);
            }else {
                App.Host.currentPlayer += 1;
                dados = { 
                    gameId : App.gameId,
                    playerAtual : App.Host.players[App.Host.currentPlayer]
                };
                IO.socket.emit('startRound', dados);
            }
        }
    },

    Player : {

        myName : '',

        data: {},

        tentativas: 3,

        pontuacao: 0,

        onJoinClick : function() {
            App.$gameArea.html(App.$joinLobby);
        },

        onPlayerStartClick : function() {
            var data = {
                gameId : +($('#inputLobbyNum').val()),
                playerName : $('#inputPlayerName').val()
            };

            IO.socket.emit('playerJoinGame', data);

            App.myRole = 'Player';
            App.Player.myName = data.playerName;
        },

        updateWaitingScreen : function(data) {
            if(IO.socket.sessionid === data.mySocketId){
                App.gameId = data.gameId;

                $('#playerWaitingMessage')
                    .append('<p/>')
                    .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
            }
        },

        proximaRonda : function () {  },

        startGame : function(data) {

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
            App.Player.tentativas = 3;
            if(App.Player.myName === data.playerName){
                App.$gameArea.html(App.$playScreen);
                $('#word').text(data.escolha);
                this.desenhar();
            }
            else {
                App.$gameArea.html(App.$guessScreen);
            }
        },

        desenhar : function() {

            const canvas = document.getElementById("drawCanvas");
            const ctx = canvas.getContext("2d");
            let coord = { x:0, y:0};
            const div = document.getElementById("left");

            var cor = "#ACD3ED";

            let linha = {
                ponto1: { x:0, y:0 },
                ponto2: { x:0, y:0 }
            }

            canvas.addEventListener("mousedown", start);
            canvas.addEventListener("mouseup", stop);

            ctx.canvas.width = div.offsetWidth;
            ctx.canvas.height = div.offsetHeight;

            function start(event) {
                canvas.addEventListener("mousemove", draw);
                reposition(event);
            }

            function reposition(event) {
                coord.x = (event.clientX - ctx.canvas.offsetLeft) / div.offsetWidth;
                coord.y = (event.clientY - ctx.canvas.offsetTop) / div.offsetHeight;
            }

            function stop() {
                canvas.removeEventListener("mousemove", draw);
            }

            function draw(event) {
                //mudar entre desenhar e apagar
                if($('#pencil').prop("checked")){
                    cor = "#ACD3ED";
                } else if($('#eraser').prop("checked")){
                    cor = "#FFFFFF";
                }

                linha.ponto1.x = coord.x;
                linha.ponto1.y = coord.y;
                
                reposition(event);
                linha.ponto2.x = coord.x;
                linha.ponto2.y = coord.y;
                
                data = {linha: linha,
                        cor: cor};
                IO.socket.emit('drawLine', data);
            }

            IO.socket.on('drawLine', function(data) {
                ctx.beginPath();
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.strokeStyle = data.cor;
                ctx.moveTo(data.linha.ponto1.x * div.offsetWidth, data.linha.ponto1.y * div.offsetHeight);
                ctx.lineTo(data.linha.ponto2.x * div.offsetWidth, data.linha.ponto2.y * div.offsetHeight);
                ctx.stroke();
            });
        },

        adivinhaPalavra : function () { 
            
            palavra = $('#inputGuessWord').val();

            IO.socket.emit('advinhaPalavra', palavra);

            IO.socket.once('palavraCerta', function() {
                document.getElementById('btnGuessWord').style.visibility = 'hidden';
                App.Player.pontuacao += 1;
                data = {errouTudo: false};
                IO.socket.emit('proximaRonda', data);
                switch (App.Player.tentativas) {
                    case 3:
                        document.getElementById('dot1').style.backgroundColor = "green";
                        document.getElementById('texto').innerHTML = "ACERTASTE!!!";
                        break;
                
                    case 2:
                        document.getElementById('dot2').style.backgroundColor = "green";
                        document.getElementById('texto').innerHTML = "ACERTASTE!!!";
                        break;

                    case 1:
                        document.getElementById('dot3').style.backgroundColor = "green";
                        document.getElementById('texto').innerHTML = "ACERTASTE!!!";
                        break;
                }
            });

            IO.socket.once('palavraErrada', function () { 
                document.getElementById('inputGuessWord').value = "";
                switch (App.Player.tentativas) {
                    case 3:
                        document.getElementById('dot1').style.backgroundColor = "red";
                        App.Player.tentativas = 2;
                        break;
                
                    case 2:
                        document.getElementById('dot2').style.backgroundColor = "red";
                        App.Player.tentativas = 1;
                        break;

                    case 1:
                        document.getElementById('dot3').style.backgroundColor = "red";
                        document.getElementById('texto').innerHTML = "ESGOTASTE TODAS AS TENTATIVAS";
                        document.getElementById('btnGuessWord').style.visibility = 'hidden';
                        data = {errouTudo: true};
                        IO.socket.emit('proximaRonda', data);
                        App.Player.tentativas = 0;
                        break;
                }
            });
        },

        acabaJogo : function() {
            App.$gameArea.html(App.$paginaInicial);
        }
    }
};

IO.init();
App.init();