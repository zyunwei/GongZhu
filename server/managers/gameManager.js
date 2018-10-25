import global from "../global";
import cardManager from './cardManager'

const gameManager = {
    startGame(room) {
        let newGame = {
            gameId: new Date().getTime(),
            roomNo: room.no,
            players: [],
            turn: 0,
            firstDealerIndex: 0
        };

        let cards = cardManager.getAllCard();
        cards = cardManager.shuffle(cards);
        cards = cardManager.splitParts(cards, 4);
        cards = cardManager.sortCards(cards);

        room.players.forEach(function (e, i) {
            newGame.players.push({
                unionId: e.unionId,
                cards: cards[i]
            });
            cards[i].some(function (ee, ii) {
                if (ee.suit === "club" && ee.number === 2) {
                    newGame.firstDealerIndex = i;
                }
            });
        });

        room.gameId = newGame.gameId;
        room.status = 1;

        newGame.currentTurn = {
            firstIndex: newGame.firstDealerIndex,
            turnPlayer: newGame.players[newGame.firstDealerIndex].unionId,
            turnCards: [],
            turnTimeout: 20,
            firstSuit: '',
            pointCards: [[], [], [], []]
        };

        global.games.push(newGame);

        global.io.in("room" + room.no).emit("notify", {
            type: "updateTurn",
            data: newGame.currentTurn
        });
        global.io.in("lobby").emit("notify", {type: "updateLobby"});
    },
    getGameByRoomNo(roomNo) {
        for (let room of global.rooms) {
            if (room.no === roomNo) {
                return this.getGameByGameId(room.gameId);
            }
        }
        return null;
    },
    getGameByGameId(gameId) {
        for (let game of global.games) {
            if (game.gameId === gameId) {
                return game;
            }
        }
        return null;
    },
    getCardInfo(game, unionId) {
        for (let player of game.players) {
            if (player.unionId === unionId) {
                return player.cards;
            }
        }
        return [];
    },
    playCard(game, unionId, selectedCard) {
        let success = 0;
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].unionId === unionId) {
                let turnCard = null;
                for (let j = game.players[i].cards.length - 1; j >= 0; j--) {
                    if (game.players[i].cards[j].number === selectedCard.number &&
                        game.players[i].cards[j].suit === selectedCard.suit) {
                        turnCard = game.players[i].cards[j];
                        game.players[i].cards.splice(j, 1);
                        success = 1;
                    }
                }
                if (success === 1) {
                    game.turn++;
                    game.currentTurn.turnCards.push(turnCard);
                    if (game.currentTurn.firstSuit === '') {
                        game.currentTurn.firstSuit = turnCard.suit;
                    }

                    if (game.currentTurn.turnCards.length >= 4) {
                        let bigPlayerIndex = cardManager.getBigPlayerIndex(game.currentTurn.turnCards);
                        let self = this;
                        setTimeout(function () {
                            self.startNewTurn(game, bigPlayerIndex);
                        }, 2000);
                        game.currentTurn.turnPlayer = -1;
                    } else {
                        game.currentTurn.turnPlayer = game.players[(game.currentTurn.firstIndex + game.currentTurn.turnCards.length) % 4].unionId;
                    }
                    break;
                }
            }
        }

        return success === 1;
    },
    startNewTurn(game, bigPlayerIndex) {
        let pointCards = cardManager.getPointCards(game.currentTurn.turnCards);
        for (let card of pointCards) {
            game.currentTurn.pointCards[(game.currentTurn.firstIndex + bigPlayerIndex) % 4].push(card);
        }

        game.currentTurn.turnCards.splice(0, game.currentTurn.turnCards.length);
        game.currentTurn.firstIndex = (game.currentTurn.firstIndex + bigPlayerIndex) % 4;
        game.currentTurn.turnPlayer = game.players[game.currentTurn.firstIndex].unionId;
        game.currentTurn.firstSuit = '';
        game.currentTurn.turnTimeout = 20;
        global.io.in("room" + game.roomNo).emit("notify", {
            type: "updateTurn",
            data: game.currentTurn
        });
    }
};

export default gameManager;