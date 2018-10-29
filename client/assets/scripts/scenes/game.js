import global from "../global";
import utils from "../utils";

cc.Class({
    extends: cc.Component,

    properties: {
        playerInfos: {
            default: [],
            type: [cc.Node]
        },
        pokerDemo: {
            default: null,
            type: cc.Prefab
        },
        smallPokerDemo: {
            default: null,
            type: cc.Prefab
        },
        isGameStart: false,
        isInitCards: false,
        myPosition: 0,
        localTurnCards: [],
        localPointCards: []
    },
    onLoad() {
        this.localPointCards = [[], [], [], []];
        this.node.getChildByName("btnPlayCard").active = false;
    },
    start() {
        if (!global.net.socket) {
            cc.director.loadScene("login");
            return;
        }
        this.playerInfos.forEach(function (e) {
            e.active = false;
        });

        let self = this;

        this.schedule(function () {
            let lastUpdate = null;
            let lastTurnInfo = null;
            while (global.notifyQueue.length > 0) {
                let notify = global.notifyQueue.shift();
                if (notify) {
                    switch (notify.type) {
                        case "updateRoom":
                            lastUpdate = 1;
                            break;
                        case "updateTurn":
                            lastTurnInfo = notify.data;
                            break;
                    }
                }
            }
            if (lastUpdate != null) {
                this.updateInfo();
            }
            ;

            if (lastTurnInfo != null) {
                this.updateTurn(self, lastTurnInfo);
            }
        }, 0.3);

        this.updateInfo();
    },
    exitRoomClick(event, data) {
        global.net.exitRoom(global.roomNo, function (result) {
            cc.director.loadScene("lobby");
        });
    },
    getMyPosition(userList) {
        let me = -1;
        for (let i = 0; i < userList.length; i++) {
            if (userList[i].unionId === global.loginInfo.unionId) {
                me = i;
                break;
            }
        }

        return me;
    },
    updateInfo: function () {
        let self = this;
        global.net.getRoomInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.playerInfos.forEach(function (e) {
                    e.active = false;
                });

                if (result.data.status === 1 && !self.isInitCards) {
                    self.initCards(self);
                }

                self.myPosition = self.getMyPosition(result.data.userList);

                result.data.userList.forEach(function (e, i) {
                    let showIndex = i - self.myPosition;
                    if (showIndex < 0) showIndex += 4;

                    if (e.nickName) {
                        let playerInfo = self.playerInfos[showIndex].getComponent("playerInfo");
                        self.playerInfos[showIndex].active = true;
                        if (e.isOnline === 0) {
                            e.nickName = e.nickName + "(断线)";
                        }

                        playerInfo.init(e.nickName, e.money, e.unionId);

                        playerInfo.setReadyStatus(result.data.status === 0 && e.status === 1);

                        if (showIndex === 0) {
                            self.node.getChildByName("btnReady").active = e.status !== 1;
                        }
                    }
                });

                switch (result.data.status) {
                    case 0:
                        self.node.getChildByName("btnExit").active = true;
                        break;
                    case 1:
                        self.node.getChildByName("btnExit").active = false;
                        break;
                    case 2:
                        self.node.getChildByName("btnExit").active = true;
                        break;
                }
            } else {
                utils.messageBox("错误", result.message);
            }
        });
    },
    readyClick(event, data) {
        let self = this;
        global.net.setReady(function (result) {
            if (result.success === "1") {
                self.node.getChildByName("btnReady").active = false;
            } else {
                utils.messageBox("失败", result.message, function () {
                    self.node.getChildByName("btnReady").active = true;
                });
            }
        });
    },
    initCards(self) {
        global.net.getCardInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                let myCards = self.node.getChildByName("myCards");
                myCards.removeAllChildren(true);
                result.data.forEach(function (e, i) {
                    let showCard = cc.instantiate(self.pokerDemo);
                    let pokerScript = showCard.getComponent("pokerCard");
                    pokerScript.init(e.suit, e.number);
                    showCard.parent = myCards;
                });
                self.isGameStart = true;
                self.isInitCards = true;
            } else {
                utils.messageBox("失败", result.message);
            }

            self.initTurn(self);
        });
    },
    initTurn(self) {
        global.net.getTurnInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.updateTurn(self, result.data)
            } else {
                utils.messageBox("失败", result.message);
            }
        });
    },
    updateTurn(self, currentTurn) {
        // 处理自动出牌
        let myCards = self.node.getChildByName("myCards");
        for (let card of currentTurn.playedCards) {
            for (let i = myCards.children.length - 1; i >= 0; i--) {
                let pokerCard = myCards.children[i].getComponent("pokerCard");
                if (pokerCard.number == card.number && pokerCard.suit == card.suit) {
                    myCards.children[i].destroy();
                }
            }
        }

        // 设置倒计时
        for (let i = 0; i < self.playerInfos.length; i++) {
            let playerInfo = self.playerInfos[i].getComponent("playerInfo");
            playerInfo.setCountdown(-1);
            if (currentTurn.turnPlayer === playerInfo.unionId) {
                playerInfo.setCountdown(currentTurn.turnTimeout);
            }
        }

        let isMyTurn = currentTurn.turnPlayer === global.loginInfo.unionId;

        // 查询所有牌中有没有当前轮的花色
        let hasTurnSuit = false;
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");
            if (pokerCard.suit === currentTurn.firstSuit) {
                hasTurnSuit = true;
                break;
            }
        }

        // 设置可选牌范围
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");
            pokerCard.setDisableMask(false);
            pokerCard.canTouch = isMyTurn;
            if (isMyTurn && hasTurnSuit) {
                let canSelect = currentTurn.firstSuit === '' || (currentTurn.firstSuit !== ''
                    && pokerCard.suit === currentTurn.firstSuit);
                if (!canSelect)
                    pokerCard.canTouch = false;
                pokerCard.setDisableMask(!canSelect);
            }
        }

        self.node.getChildByName("btnPlayCard").active = isMyTurn;

        let turnCards = self.node.getChildByName("turnCards");

        // 判断本地回合数据是否是新数据，不为最新则清空桌面
        if (self.localTurnCards.length > 0) {
            if (currentTurn.turnCards.length === 0 ||
                currentTurn.turnCards[0].suit !== self.localTurnCards[0].suit ||
                currentTurn.turnCards[0].number !== self.localTurnCards[0].number) {
                self.localTurnCards.splice(0, self.localTurnCards.length);
                // 一轮结束，桌上的牌往下一轮出牌人的方向飞过去
                // 将牌桌牌复制一份用于动画过度
                let copyTurnCards = cc.instantiate(turnCards);
                copyTurnCards.name = "copyTurnCards";
                self.node.addChild(copyTurnCards);

                let flyX, flyY = 0;
                let flyPosition = currentTurn.firstIndex - self.myPosition;
                if (flyPosition < 0) flyPosition += 4;
                switch (flyPosition) {
                    case 0 :
                        flyX = 0;
                        flyY = -cc.winSize.height;
                        break;
                    case 1 :
                        flyX = cc.winSize.width;
                        flyY = 0;
                        break;
                    case 2 :
                        flyX = 0;
                        flyY = cc.winSize.height;
                        break;
                    case 3 :
                        flyX = -cc.winSize.width;
                        flyY = 0;
                        break;
                }

                for (let i = 0; i < copyTurnCards.children.length; i++) {
                    let action = cc.moveTo(0.5, flyX, flyY);
                    copyTurnCards.children[i].runAction(action.easing(cc.easeIn(5)));
                }
                // 删掉飞出去的牌
                self.scheduleOnce(function () {
                    copyTurnCards.removeAllChildren();
                    copyTurnCards.destroy();
                }, 1);

                turnCards.removeAllChildren();
            }
        }

        for (let i = 0; i < currentTurn.turnCards.length; i++) {
            if (self.localTurnCards.length - 1 >= i) {
                // 已经绘制过，跳过
                continue;
            }

            self.localTurnCards.push(currentTurn.turnCards[i]);

            let offsetX = 0;
            let offsetY = 0;

            let showIndex = currentTurn.firstIndex - self.myPosition + i;
            if (showIndex < 0) showIndex += 4;

            switch (showIndex % 4) {
                case 0:
                    offsetY = -80;
                    break;
                case 1:
                    offsetX = 100;
                    break;
                case 2:
                    offsetY = 80;
                    break;
                case 3:
                    offsetX = -100;
                    break;
            }

            let showCard = cc.instantiate(self.pokerDemo);
            let pokerScript = showCard.getComponent("pokerCard");
            pokerScript.init(currentTurn.turnCards[i].suit, currentTurn.turnCards[i].number);
            showCard.setPosition(offsetX, offsetY);
            turnCards.addChild(showCard);
        }

        // 得牌显示
        for (let i = 0; i < currentTurn.pointCards.length; i++) {
            let showIndex = i - self.myPosition;
            if (showIndex < 0) showIndex += 4;

            let pointCardsBox = null;
            switch (showIndex) {
                case 0:
                    pointCardsBox = self.node.getChildByName("pointCardsSouth");
                    break;
                case 1:
                    pointCardsBox = self.node.getChildByName("pointCardsEast");
                    break;
                case 2:
                    pointCardsBox = self.node.getChildByName("pointCardsNorth");
                    break;
                case 3:
                    pointCardsBox = self.node.getChildByName("pointCardsWest");
                    break;
            }

            if (pointCardsBox != null) {
                for (let j = 0; j < currentTurn.pointCards[i].length; j++) {
                    let localExist = false;
                    for (let card of self.localPointCards[i]) {
                        if (card.suit === currentTurn.pointCards[i][j].suit && card.number === currentTurn.pointCards[i][j].number) {
                            localExist = true;
                            break;
                        }
                    }
                    if (localExist) {
                        continue;
                    }
                    self.localPointCards[i].push(currentTurn.pointCards[i][j]);
                    let showCard = cc.instantiate(self.smallPokerDemo);
                    let pokerScript = showCard.getComponent("pokerCard");
                    pokerScript.init(currentTurn.pointCards[i][j].suit, currentTurn.pointCards[i][j].number);
                    showCard.parent = pointCardsBox;
                }
            }
        }
    },
    playCardClick(event, data) {
        let self = this;
        let myCards = self.node.getChildByName("myCards");
        let selectedCard = null;
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");

            if (pokerCard.isTouched) {
                if (selectedCard != null) {
                    utils.messageBox("提示", "您只能选择一张牌");
                    return;
                }
                selectedCard = {suit: pokerCard.suit, number: pokerCard.number};
            }
        }

        if (!selectedCard) {
            utils.messageBox("提示", "请选择要出的牌");
            return;
        }

        global.net.playCard(selectedCard, function (result) {
            if (result.success === "1") {
                for (let i = myCards.children.length - 1; i >= 0; i--) {
                    let pokerCard = myCards.children[i].getComponent("pokerCard");
                    if (pokerCard.isTouched) {
                        myCards.children[i].destroy();
                    }
                }
            } else {
                utils.messageBox("失败", result.message);
            }
        });
    },
});
