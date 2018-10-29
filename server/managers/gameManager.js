import global from "../global";
import cardManager from './cardManager'

const gameManager = {
    getClientTurnInfo(game) {
        return {
            currentTurn: game.currentTurn,
            pointCards: game.pointCards,
            playedCards: game.playedCards
        }
    },
    startShowdown(room) {
        let newGame = {
            gameId: new Date().getTime(),
            roomNo: room.no,
            players: [],
            turn: 0,
            firstDealerIndex: 0,
            showdownCards: [[], [], [], []],
            pointCards: [[], [], [], []],
            playedCards: [],
        }

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

        global.games.push(newGame);

        global.io.in("room" + room.no).emit("notify", {type: "updateRoom"});
        global.io.in("lobby").emit("notify", {type: "updateLobby"});
    },
    startGame(room) {
        room.status = 2;

        let game = this.getGameByRoomNo(room.no);

        game.currentTurn = {
            firstIndex: game.firstDealerIndex,
            turnPlayer: game.players[game.firstDealerIndex].unionId,
            turnCards: [],
            turnTimeout: 15,
            firstSuit: ''
        };

        global.io.in("room" + room.no).emit("notify", {
            type: "updateTurn",
            data: this.getClientTurnInfo(game)
        });

        global.io.in("lobby").emit("notify", {type: "updateLobby"});
    },
    getRoomByRoomNo(roomNo) {
        for (let room of global.rooms) {
            if (room.no === roomNo) {
                return room;
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
    getGameByRoomNo(roomNo) {
        let room = this.getRoomByRoomNo(roomNo);
        if (room != null) {
            return this.getGameByGameId(room.gameId);
        }
        return null;
    },
    getCardByUnionId(game, unionId) {
        for (let player of game.players) {
            if (player.unionId === unionId) {
                return player.cards;
            }
        }
        return [];
    },
    // 亮牌
    showdown(game, unionId, selectedCard) {
        let room = this.getRoomByRoomNo(game.roomNo);
        if (!room) {
            return false;
        }

        let playerStatus = 0;
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].unionId === unionId) {
                if (room.players[i].status !== 1) {
                    return false;
                }

                for (let card of selectedCard) {
                    game.showdownCards[i].push(card);
                }

                room.players[i].status = 2;
                playerStatus = room.players[i].status;
                break;
            }
        }

        let showdownFinishCount = 0;

        for (let player of room.players) {
            if (player.status === 2) {
                showdownFinishCount += 1;
            }
        }

        let data = {
            playerStatus: playerStatus,
            showdownCards: game.showdownCards
        };

        global.io.in("room" + game.roomNo).emit("notify", {type: "updateShowdown", data});

        if (showdownFinishCount >= 4) {
            this.startGame(this.getRoomByRoomNo(game.roomNo));
        }

        return true;
    },
    // 出牌
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
                    game.playedCards.push(turnCard);
                    if (game.currentTurn.firstSuit === '') {
                        game.currentTurn.firstSuit = turnCard.suit;
                    }

                    if (game.currentTurn.turnCards.length >= 4) {
                        let bigPlayerIndex = cardManager.getBigPlayerIndex(game.currentTurn.turnCards);
                        let self = this;
                        setTimeout(function () {
                            self.startNewTurn(game, bigPlayerIndex);
                        }, 1500);
                        game.currentTurn.turnPlayer = -1;
                    } else {
                        game.currentTurn.turnPlayer = game.players[(game.currentTurn.firstIndex + game.currentTurn.turnCards.length) % 4].unionId;
                    }
                    game.currentTurn.turnTimeout = 15;
                    break;
                }
            }
        }

        return success === 1;
    },
    startNewTurn(game, bigPlayerIndex) {
        let pointCards = cardManager.getPointCards(game.currentTurn.turnCards);
        for (let card of pointCards) {
            game.pointCards[(game.currentTurn.firstIndex + bigPlayerIndex) % 4].push(card);
        }

        game.currentTurn.turnCards.splice(0, game.currentTurn.turnCards.length);
        game.currentTurn.firstIndex = (game.currentTurn.firstIndex + bigPlayerIndex) % 4;
        game.currentTurn.turnPlayer = game.players[game.currentTurn.firstIndex].unionId;
        game.currentTurn.firstSuit = '';
        game.currentTurn.turnTimeout = 15;
        global.io.in("room" + game.roomNo).emit("notify", {
            type: "updateTurn",
            data: this.getClientTurnInfo(game)
        });
    },
    autoPlayTurn(game) {
        if (game.turnPlayer < 0) return;
        let cardInfo = this.getCardByUnionId(game, game.currentTurn.turnPlayer);
        let selectedCard = cardManager.getAutoPlayCard(game.currentTurn.turnCards, cardInfo);
        if (selectedCard) {
            this.playCard(game, game.currentTurn.turnPlayer, selectedCard);
            global.io.in("room" + game.roomNo).emit("notify", {
                type: "updateTurn",
                data: this.getClientTurnInfo(game)
            });
        }
    }
};

export default gameManager;