const cardManager = {
    getAllCard() {
        // 获得所有牌
        let cards = [];
        for (let i = 1; i <= 13; i++) {
            cards.push({number: i, suit: 'spade'});
            cards.push({number: i, suit: 'heart'});
            cards.push({number: i, suit: 'diamond'});
            cards.push({number: i, suit: 'club'});
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
                    if (cards[r][j].score > cards[r][j + 1].score) {
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
    getBigPlayerIndex(turnCards){
        // 每轮牌大小比较，找出最大的出牌玩家序号
        if(turnCards.length !== 4){
            return -1;
        }

        let firstSuit = turnCards[0][0].suit;
        let bigIndex = 0;
        let bigNumberScore = this.getNumberScore(turnCards[0][0].number);

        for(let i = 1; i < 4; i++){
            if(turnCards[i][0].suit === firstSuit &&
                this.getNumberScore(turnCards[i][0].number) > bigNumberScore){
                bigNumberScore = this.getNumberScore(turnCards[i][0].number);
                bigIndex = i;
            }
        }

        return bigIndex;
    },
    getNumberScore(cardNumber){
        return cardNumber === 1 ? 14 : cardNumber;
    }
};

export default cardManager;