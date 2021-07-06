var io;
var gameSocket;
var palavraAtual;
var i = 0;

exports.initGame = function(socketIo, socket){
    io = socketIo;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    gameSocket.on('hostCreateLobby', hostCreateLobby);
    gameSocket.on('startRound', startRound);
    gameSocket.on('playerEscolha', onPlayerEscolha);

    gameSocket.on('mouse', drawLine);
    gameSocket.on('playerJoinGame', playerJoinGame);

    gameSocket.on('drawLine', onDrawLine);

    gameSocket.on('advinhaPalavra', adivinhaPalavra);
    gameSocket.on('acabarJogo', acabaJogo);

    gameSocket.on('proximaRonda', proximaRonda);
};


function onDrawLine(data){

    io.emit('drawLine', data);
}

function acabaJogo() {
    io.emit('acabarJogo');
}

function proximaRonda(data){

    if(data.errouTudo){
        i += 1;
        if(i == 2){
            i = 0;
            io.emit('proximaRonda');
            return;
        } 
    } else {
        io.emit('proximaRonda');
    }
    
}

//HOST

function hostCreateLobby() {
    var thisGameId = (Math.random() * 10000) | 0;

    this.emit('lobbyCreated', {gameId: thisGameId, mySocketId: this.id});

    this.join(thisGameId);
}

function startRound(data) {
    //var sock = this;
    /*var data = {
        mySocketId : sock.id,
        gameId : gameId
    };*/

    var words = randomWords();

    data.words = words;

    io.emit('beginGame', data);
}

function drawLine(data){
    io.to(this).emit('painter', data);
}


//PLAYER

function playerJoinGame(data) {

    var sock = this;
    //var room = gameSocket.manager.rooms["/" + data.gameId];

    //if(room != undefined){
        data.mySocketId = sock.id;
        sock.join(data.gameId);
        io.to(data.gameId).emit('playerJoinedRoom', data);
    //} else {
        //this.emit('error', {message: "This room does not exist."});
    //}
}

function adivinhaPalavra (data) {
    if(palavraAtual === data){
        io.emit('palavraCerta');
    } else {
        io.emit('palavraErrada');
    }
}

function onPlayerEscolha(data) {
    wordPool.splice(wordPool.indexOf(data.escolha), 1);
    palavraAtual = data.escolha;
    io.emit('startRound', data);
    io.emit('palavra', palavraAtual);
}

//GAME LOGIC

function randomWords() {
    
    var words = [];

    for(var i = 0; i < 3; i++){
        var word;
        do {
            word = wordPool[Math.floor(Math.random() * wordPool.length)];
        } while (words.includes(word) === true);
        words.push(word);
    }

    return words;
}

var wordPool = [
    "bola", "banana", "casa", "computador", "telemovel", "chavena", "gritar", "andar", "pensar",
    "dormir", "escrever", "dor"
];

var chosenWords = [];