import global from "../global";
import gameManager from "./gameManager";

const cardManager = {
    getExposeInfo(game) {
        let exposes = [];
        for (let i = 0; i < game.players.length; i++) {
            exposes.push({
                unionId: game.players[i].unionId,
                isExpose: game.players[i].isExpose,
                exposeCards: game.exposeCards[i]
            });
        }
        return exposes;
    },
    getAllCard() {
        // 获得所有牌
        let cards = [];
        let suits = ['spade', 'heart', 'diamond', 'club'];
        for (let i = 1; i <= 13; i++) {
            for (let suit of suits) {
                //if (i < 9 && suit !== 'heart') continue; // 加速测试，每人7张

                let cardInfo = {number: i, suit: suit, point: 0, ex: ''};

                if (suit === 'spade' && i === 12) {
                    cardInfo.point = -100;
                    cardInfo.ex = 'pig';
                } else if (suit === 'diamond' && i === 11) {
                    cardInfo.point = 100;
                    cardInfo.ex = 'sheep';
                }
                else if (suit === 'club' && i === 10) {
                    cardInfo.point = 50;
                    cardInfo.ex = 'double';
                } else if (suit === 'heart') {
                    cardInfo.ex = 'point';
                    switch (i) {
                        case 1:
                            cardInfo.point = -50;
                            break;
                        case 2:
                        case 3:
                        case 4:
                            cardInfo.point = 0;
                            break;
                        case 5:
                        case 6:
                        case 7:
                        case 8:
                        case 9:
                        case 10:
                            cardInfo.point = -10;
                            break;
                        case 11:
                            cardInfo.point = -20;
                            break;
                        case 12:
                            cardInfo.point = -30;
                            break;
                        case 13:
                            cardInfo.point = -40;
                            break;
                    }
                }

                cards.push(cardInfo);
            }
        }

        return cards;
    },
    shuffle(cards) {
        // 洗牌
        let tmpCard = null;
        for (let i = 0; i < cards.length; i++) {
            let swapIndex = Math.floor(Math.random() * cards.length);
            tmpCard = cards[swapIndex];
            cards[swapIndex] = cards[i];
            cards[i] = tmpCard;
        }

        return cards;
    },
    splitParts(cards, partCount) {
        // 分牌
        if (partCount <= 0 || partCount > cards.length) {
            return cards;
        }

        let splittedCards = [];
        for (let i = 0; i < partCount; i++) {
            splittedCards.push([]);
        }

        for (let i = 0; i < cards.length; i++) {
            let index = i % partCount;
            splittedCards[index].push(cards[i]);
        }

        return splittedCards;
    },
    sortCards(cards) {
        // 排序
        let suits = ['club', 'diamond', 'spade', 'heart'];
        for (let i = 0; i < cards.length; i++) {
            for (let j = 0; j < cards[i].length; j++) {
                suits.forEach(function (e, score) {
                    if (cards[i][j].suit === e) {
                        let numberScore = cards[i][j].number;
                        if (numberScore === 1) {
                            numberScore = 14;
                        }
                        cards[i][j].score = score * 100 + numberScore;
                    }
                });
            }
        }
        let tmpCard = null;
        for (let r = 0; r < cards.length; r++) {
            for (let i = 0; i < cards[r].length - 1; i++) {
                for (let j = 0; j < cards[r].length - 1 - i; j++) {
                    if (cards[r][j].score < cards[r][j + 1].score) {
                        tmpCard = cards[r][j];
                        cards[r][j] = cards[r][j + 1];
                        cards[r][j + 1] = tmpCard;
                    }
                }
            }
        }

        for (let i = 0; i < cards.length; i++) {
            for (let j = 0; j < cards[i].length; j++) {
                delete cards[i][j].score;
            }
        }

        return cards;
    },
    getBigPlayerIndex(turnCards) {
        // 每轮牌大小比较，找出最大的出牌玩家序号
        if (turnCards.length !== 4) {
            return -1;
        }

        let firstSuit = turnCards[0].suit;
        let bigIndex = 0;
        let bigNumberScore = this.getNumberScore(turnCards[0].number);

        for (let i = 1; i < 4; i++) {
            if (turnCards[i].suit === firstSuit &&
                this.getNumberScore(turnCards[i].number) > bigNumberScore) {
                bigNumberScore = this.getNumberScore(turnCards[i].number);
                bigIndex = i;
            }
        }

        return bigIndex;
    },
    getNumberScore(cardNumber) {
        // 牌大小比较
        return cardNumber === 1 ? 14 : cardNumber;
    },
    getPointCards(turnCards) {
        // 牌点数
        let pointCards = [];
        for (let card of turnCards) {
            if (card.ex !== '') {
                pointCards.push(card);
            }
        }
        return pointCards;
    },
    getAutoPlayCard(game, unionId) {
        // 自动出牌
        let turnCards = game.currentTurn.turnCards;
        let myCards = [];
        for (let player of game.players) {
            if (player.unionId === game.currentTurn.turnPlayer) {
                myCards = player.cards;
                break;
            }
        }

        // 梅花2
        let room = gameManager.getRoomByRoomNo(game.roomNo);
        if (room.round <= 1) {
            for (let card of myCards) {
                if (card.suit === "club" && card.number === 2) {
                    return card;
                }
            }
        }

        // 自动出当前花色
        if (turnCards.length > 0) {
            let firstSuit = turnCards[0].suit;
            for (let card of myCards) {
                if (card.suit === firstSuit) {
                    let checkResult = this.checkPlayCard(game, unionId, card);
                    if (checkResult.success === '1') {
                        return card;
                    }
                }
            }
        }

        // 随便选一张能出的牌出
        if (myCards.length > 0) {
            for (let i = myCards.length - 1; i >= 0; i--) {
                let checkResult = this.checkPlayCard(game, unionId, myCards[i]);
                if (checkResult.success === '1') {
                    return myCards[i];
                }
            }
        }

        return null;
    },
    checkPlayCard(game, unionId, selectedCard) {
        if (game.currentTurn.turnPlayer !== unionId) {
            return {success: "0", message: "轮次错误，出牌失败"};
        }

        let myCards = [];
        for (let player of game.players) {
            if (player.unionId === unionId) {
                myCards = player.cards;
                break;
            }
        }

        // 判断出的牌是自己的牌
        let isLegal = false;
        for (let card of myCards) {
            if (card.suit === selectedCard.suit && card.number === selectedCard.number) {
                isLegal = true;
                break;
            }
        }
        if (!isLegal) {
            return {success: "0", message: "出牌信息异常，请重新登录游戏"};
        }

        // 首轮先出梅花2
        let room = gameManager.getRoomByRoomNo(game.roomNo);
        if (room.round <= 1) {
            let hasClub2 = false;
            for (let card of myCards) {
                if (card.suit === "club" && card.number === 2) {
                    hasClub2 = true;
                    break;
                }
            }

            if (hasClub2 && (selectedCard.suit !== "club" || selectedCard.number !== 2)) {
                return {success: "0", message: "此局为首轮游戏，请先出梅花2"}
            }
        }

        // 有相同花色必须先出
        let hasSameSuit = false;
        let firstSuit = null;
        if (game.currentTurn.turnCards.length > 0) {
            firstSuit = game.currentTurn.turnCards[0].suit;
            for (let card of myCards) {
                if (card.suit === firstSuit.suit) {
                    hasSameSuit = true;
                    break;
                }
            }
        }

        if (firstSuit && hasSameSuit && (selectedCard.suit !== firstSuit)) {
            return {success: "0", message: "必须出相同花色"}
        }

        let exposeCards = [];
        for (let expose of game.exposeCards) {
            for (let card of expose) {
                exposeCards.push(card);
            }
        }

        let isExposeCard = false;
        for (let expose of exposeCards) {
            if (expose.suit === selectedCard.suit && expose.number === selectedCard.number) {
                isExposeCard = true;
                break;
            }
        }

        let isFirstRound = game.suitPlayStatus[selectedCard.suit] === 0;

        // 花色首轮不能出卖过的牌,除非只剩下一张
        if (!firstSuit && isFirstRound && isExposeCard && myCards.length > 1) {
            switch (selectedCard.suit) {
                case 'spade':
                    if (selectedCard.number === 12) {
                        return {success: "0", message: "黑桃Q已亮牌，不能在黑桃首轮出"};
                    }
                    break;
                case 'heart':
                    if (selectedCard.number === 1) {
                        return {success: "0", message: "红桃A已亮牌，不能在红桃首轮出"};
                    }
                    break;
                case 'diamond':
                    if (selectedCard.number === 11) {
                        return {success: "0", message: "方片J已亮牌，不能在方片首轮出"};
                    }
                    break;
                case 'club':
                    if (selectedCard.number === 10) {
                        return {success: "0", message: "梅花10已亮牌，不能在梅花首轮出"};
                    }
                    break;
            }
        }

        // 花色首轮不能跟亮过的牌，但只有一张时可以跟
        if (firstSuit && isFirstRound && isExposeCard) {
            let sameSuitCount = 0;
            for (let card of myCards) {
                if (card.suit === firstSuit) {
                    sameSuitCount += 1;
                }
            }

            if (sameSuitCount > 1) {
                switch (selectedCard.suit) {
                    case 'spade':
                        if (selectedCard.number === 12) {
                            return {success: "0", message: "黑桃Q已亮牌，请出其它黑桃牌"};
                        }
                        break;
                    case 'heart':
                        if (selectedCard.number === 1) {
                            return {success: "0", message: "红桃A已亮牌，请出其它红桃牌"};
                        }
                        break;
                    case 'diamond':
                        if (selectedCard.number === 11) {
                            return {success: "0", message: "方片J已亮牌，请出其它方片牌"};
                        }
                        break;
                    case 'club':
                        if (selectedCard.number === 10) {
                            return {success: "0", message: "梅花10已亮牌，请出其它梅花牌"};
                        }
                        break;
                }
            }
        }


        return {success: "1", message: ""};
    },
    checkGameOver(game) {
        // 检查含分牌是否已打完
        let count = 0;
        for (let card of game.playedCards) {
            if (card.ex !== '')
                count++;
        }
        return count >= 16;
    },
    checkExpose(game) {
        // 检查亮牌数，亮3张时必须全亮四张
        let exposeCards = [];
        for (let expose of game.exposeCards) {
            for (let card of expose) {
                exposeCards.push(card);
            }
        }

        if (exposeCards.length === 3) {
            for (let i = 0; i < game.players.length; i++) {
                for (let card of game.players[i].cards) {
                    if (card.ex === 'point' && card.number === 1 ||
                        card.ex === 'pig' || card.ex === 'sheep' || card.ex === 'double') {
                        let needExpose = true;
                        for (let expose of exposeCards) {
                            if (expose.suit === card.suit && expose.number === card.number) {
                                needExpose = false;
                            }
                        }

                        if (needExpose) {
                            game.exposeCards[i].push({
                                suit: card.suit,
                                number: card.number
                            });
                            global.io.in("room" + game.roomNo).emit("notify", {
                                type: "updateExpose",
                                data: this.getExposeInfo(game)
                            });
                            break;
                        }
                    }
                }
            }
        }
    },
    getFinalScore(game) {
        let gameScore = [0, 0, 0, 0];

        let isExposeHeart = false; // 卖红桃
        let isExposePig = false; // 卖猪
        let isExposeSheep = false; // 卖羊
        let isExposeDouble = false; // 卖变压器

        for (let expose of game.exposeCards) {
            for (let card of expose) {
                if (card.suit === 'heart' && card.number === 1) {
                    isExposeHeart = true;
                }
                else if (card.suit === 'spade' && card.number === 12) {
                    isExposePig = true;
                }
                else if (card.suit === 'diamond' && card.number === 11) {
                    isExposeSheep = true;
                }
                else if (card.suit === 'club' && card.number === 10) {
                    isExposeDouble = true;
                }
            }
        }

        // 判断有没有全收
        let isAllInHeart = true;
        let checkHeartIndex = -1;
        let isAllIn = true;
        let checkAllIndex = -1;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < game.pointCards[i].length; j++) {
                if (game.pointCards[i][j].ex === 'point') {
                    if (checkHeartIndex >= 0 && checkHeartIndex !== i) {
                        isAllInHeart = false;
                    }
                    checkHeartIndex = i;
                }

                if (checkAllIndex >= 0 && checkAllIndex !== i) {
                    isAllIn = false;
                    break;
                }
                checkAllIndex = i;
            }
        }

        // 先计算红桃、猪、羊
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < game.pointCards[i].length; j++) {
                if (game.pointCards[i][j].ex === 'point') {
                    if (isAllInHeart) {
                        // 全收红桃
                        if (isExposeHeart) {
                            gameScore[i] += Math.abs(game.pointCards[i][j].point) * 2;
                        }
                        else {
                            gameScore[i] += Math.abs(game.pointCards[i][j].point);
                        }
                    }
                    else {
                        // 没有全收
                        if (isExposeHeart) {
                            gameScore[i] += game.pointCards[i][j].point * 2;
                        }
                        else {
                            gameScore[i] += game.pointCards[i][j].point;
                        }
                    }
                } else if (game.pointCards[i][j].ex === 'pig') {
                    // 记录下一局先出牌者
                    let room = gameManager.getRoomByRoomNo(game.roomNo);
                    if (room) {
                        room.lastPig = i;
                    }

                    // 全收
                    if (isAllIn) {
                        if (isExposePig) {
                            gameScore[i] += Math.abs(game.pointCards[i][j].point) * 2;
                        }
                        else {
                            gameScore[i] += Math.abs(game.pointCards[i][j].point);
                        }
                    }
                    else {
                        if (isExposePig) {
                            gameScore[i] += game.pointCards[i][j].point * 2;
                        }
                        else {
                            gameScore[i] += game.pointCards[i][j].point;
                        }
                    }
                } else if (game.pointCards[i][j].ex === 'sheep') {
                    if (isExposeSheep) {
                        gameScore[i] += game.pointCards[i][j].point * 2;
                    }
                    else {
                        gameScore[i] += game.pointCards[i][j].point;
                    }
                }
            }
        }

        // 计算变压器
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < game.pointCards[i].length; j++) {
                if (game.pointCards[i][j].ex === 'double') {
                    if (gameScore[i] === 0) {
                        // 只得变压器
                        if (isExposeDouble) {
                            gameScore[i] += game.pointCards[i][j].point * 2;
                        }
                        else {
                            gameScore[i] += game.pointCards[i][j].point;
                        }
                    } else {
                        // 有其他分
                        if (isExposeDouble) {
                            gameScore[i] = gameScore[i] * 4;
                        }
                        else {
                            gameScore[i] = gameScore[i] * 2;
                        }
                    }

                    break;
                }
            }
        }

        return gameScore;
    },
    // 由分数计算玩家得到金币
    getGoldChange(gameScore) {
        if (gameScore.length < 2) {
            return [];
        }

        let sum = 0;
        for (let score of gameScore) {
            sum += score;
        }

        let goldChange = [];

        for (let i = 0; i < gameScore.length; i++) {
            let gold = Math.round(gameScore[i] - (sum - gameScore[i]) / (gameScore.length - 1));
            goldChange.push(gold);
        }
        return goldChange;
    },
    // 牌型描述，用于数据库记录
    getSimpleDesc(cards) {
        let str = "";
        for (let card of cards) {
            let s = "";
            switch (card.suit) {
                case "spade":
                    s = "S";
                    break;
                case "heart":
                    s = "H";
                    break;
                case "club":
                    s = "C";
                    break;
                case "diamond":
                    s = "D";
                    break;
                default:
                    s = card.suit;
            }

            let n = "";
            if (card.number === 1) {
                n = "A";
            } else if (card.number >= 2 & card.number <= 10) {
                n = card.number;
            } else if (card.number === 11) {
                n = "J";
            } else if (card.number === 12) {
                n = "Q";
            } else if (card.number === 13) {
                n = "K";
            }

            str += s + n + " ";
        }

        return str;
    }
};

export default cardManager;