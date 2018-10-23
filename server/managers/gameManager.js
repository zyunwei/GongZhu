import global from "../global";
import cardManager from './cardManager'

const gameManager = {
    startGame(io, room) {
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
                cards: cards[i],
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
            turnPlayer: newGame.players[newGame.firstDealerIndex].unionId,
            turnCards: [],
            turnTimeout: 20
        };

        global.games.push(newGame);

        io.in("room" + room.no).emit("notify", {
            type: "updateTurn",
            data: newGame.currentTurn
        });
        io.in("lobby").emit("notify", {type: "updateLobby"});
    },
    getGameByRoomNo(roomNo) {
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no === roomNo) {
                return this.getGameByGameId(global.rooms[i].gameId);
            }
        }
        return null;
    },
    getGameByGameId(gameId) {
        for (let i = 0; i < global.games.length; i++) {
            if (global.games[i].gameId === gameId) {
                return global.games[i];
            }
        }
        return null;
    },
    getCardInfo(game, unionId) {
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].unionId === unionId) {
                return game.players[i].cards;
            }
        }
        return [];
    },
    playCard(game, unionId, selectedCard) {
        let success = 0;
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].unionId === unionId) {
                let turnCard = [];
                for (let j = game.players[i].cards.length - 1; j >= 0; j--) {
                    for (let k = 0; k < selectedCard.length; k++) {
                        if (game.players[i].cards[j].number === selectedCard[k].number &&
                            game.players[i].cards[j].suit === selectedCard[k].suit) {
                            turnCard.push(game.players[i].cards[j]);
                            game.players[i].cards.splice(j, 1);
                            success = 1;
                        }
                    }
                }
                if (success === 1) {
                    if (game.currentTurn.turnCards.length >= 4) {
                        game.currentTurn.turnCards.splice(0, game.currentTurn.turnCards.length);
                    }

                    game.currentTurn.turnCards.push(turnCard);
                    game.turn++;
                    game.currentTurn.turnPlayer = game.players[(game.firstDealerIndex + game.turn) % 4].unionId;
                    break;
                } else {
                    console.log("can't find " + JSON.stringify(selectedCard));
                }
            }
        }

        return success === 1;
    }
};

export default gameManager;