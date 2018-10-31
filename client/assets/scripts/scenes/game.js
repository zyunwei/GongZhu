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
        noShowdownMark: {
            default: null,
            type: cc.Prefab
        },
        isInitCards: false,
        roomStatus: 0,
        myPosition: 0,
        localTurnCards: [],
        localPointCards: [],
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        lblRoundNo: {
            default: null,
            type: cc.Label
        },
    },
    onLoad() {
        this.localPointCards = [[], [], [], []];
        this.node.getChildByName("btnPlayCard").active = false;
        this.node.getChildByName("btnShowdown").active = false;
        this.node.getChildByName("btnDoNotShowdown").active = false;
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
            let lastShowdownInfo = null;
            let lastGameOverInfo = null;
            while (global.notifyQueue.length > 0) {
                let notify = global.notifyQueue.shift();
                if (notify) {
                    switch (notify.type) {
                        case "updateRoom":
                            lastUpdate = 1;
                            break;
                        case "updateShowdown":
                            lastShowdownInfo = notify.data;
                            break;
                        case "updateTurn":
                            lastTurnInfo = notify.data;
                            break;
                        case "gameOver":
                            lastGameOverInfo = notify.data;
                            break;
                        case "leaveRoom":
                            cc.director.loadScene("lobby");
                            break;
                    }
                }
            }
            if (lastUpdate != null) {
                this.updateRoom();
            }

            if (lastShowdownInfo != null) {
                this.updateShowdown(self, lastShowdownInfo);
            }

            if (lastTurnInfo != null) {
                this.updateTurn(self, lastTurnInfo);
            }

            if (lastGameOverInfo != null) {
                this.gameOver(self, lastGameOverInfo);
            }
        }, 0.3);

        this.updateRoom();
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
    updateRoom: function () {
        // 更新房间信息
        let self = this;
        global.net.getRoomInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.lblRoomNo.string = "房号：" + result.data.roomNo;
                self.lblRoundNo.string = "局数：" + result.data.round;

                self.playerInfos.forEach(function (e) {
                    e.active = false;
                });

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
                            self.node.getChildByName("btnReady").active = e.status === 0;
                        }
                    }
                });

                switch (result.data.status) {
                    case 1:
                        self.node.getChildByName("btnExit").active = false;
                        break;
                    case 2:
                        self.node.getChildByName("btnExit").active = false;
                        break;
                    default:
                        self.node.getChildByName("btnExit").active = true;
                        break;
                }

                self.roomStatus = result.data.status;

                if (self.roomStatus !== 0) {
                    self.initCard(self);
                }
            } else {
                utils.messageBox("错误", result.message);
            }
        });
    },
    updateCard: function (self, cards) {
        let myCards = self.node.getChildByName("myCards");

        if (!self.isInitCards) {
            myCards.removeAllChildren(true);
            cards.forEach(function (e, i) {
                let showCard = cc.instantiate(self.pokerDemo);
                let pokerScript = showCard.getComponent("pokerCard");
                pokerScript.init(e.suit, e.number);
                showCard.parent = myCards;
            });
            self.isInitCards = true;
        }

        self.initShowdown(self);

        if (self.roomStatus === 2) {
            self.initTurn(self);
        }
    },
    updateShowdown: function (self, showdowns) {
        // 亮牌操作按钮相关
        let myCards = self.node.getChildByName("myCards");
        for (let showdown of showdowns) {
            if (showdown.unionId === global.loginInfo.unionId) {
                if (showdown.isShowdown !== 1) {
                    self.node.getChildByName("btnShowdown").active = true;
                    self.node.getChildByName("btnDoNotShowdown").active = true;
                    self.node.getChildByName("btnPlayCard").active = false;
                    let hasShowdown = false;
                    for (let i = 0; i < myCards.children.length; i++) {
                        let pokerCard = myCards.children[i].getComponent("pokerCard");
                        pokerCard.setDisableMask(true);
                        pokerCard.canTouch = false;
                        if (pokerCard.suit === 'heart' && pokerCard.number === 1 ||
                            pokerCard.suit === 'spade' && pokerCard.number === 12 ||
                            pokerCard.suit === 'diamond' && pokerCard.number === 11 ||
                            pokerCard.suit === 'club' && pokerCard.number === 10) {
                            hasShowdown = true;
                            pokerCard.canTouch = true;
                            pokerCard.setDisableMask(false);
                        }
                    }

                    if (!hasShowdown) {
                        self.node.getChildByName("btnShowdown").active = false;
                    }
                } else {
                    self.node.getChildByName("btnShowdown").active = false;
                    self.node.getChildByName("btnDoNotShowdown").active = false;
                }
                break;
            }
        }

        // 亮牌显示
        for (let i = 0; i < showdowns.length; i++) {
            let showIndex = i - self.myPosition;
            if (showIndex < 0) showIndex += 4;

            let showdownBox = null;
            switch (showIndex) {
                case 0:
                    showdownBox = self.node.getChildByName("showdownSouth");
                    break;
                case 1:
                    showdownBox = self.node.getChildByName("showdownEast");
                    break;
                case 2:
                    showdownBox = self.node.getChildByName("showdownNorth");
                    break;
                case 3:
                    showdownBox = self.node.getChildByName("showdownWest");
                    break;
            }

            if (showdownBox != null) {
                showdownBox.destroyAllChildren();
                if (showdowns[i].showdownCards.length > 0) {
                    for (let j = 0; j < showdowns[i].showdownCards.length; j++) {
                        let showCard = cc.instantiate(self.smallPokerDemo);
                        let pokerScript = showCard.getComponent("pokerCard");
                        pokerScript.init(showdowns[i].showdownCards[j].suit, showdowns[i].showdownCards[j].number);
                        showCard.parent = showdownBox;
                    }
                }
                else if (showdowns[i].isShowdown === 1) {
                    let noShowdownMark = cc.instantiate(self.noShowdownMark);
                    noShowdownMark.parent = showdownBox;
                }
            }
        }
    },
    initCard(self) {
        global.net.getCardInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.updateCard(self, result.data)
            } else {
                utils.messageBox("更新牌面信息失败", result.message);
            }
        });
    },
    initTurn(self) {
        global.net.getTurnInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.updateTurn(self, result.data)
            } else {
                utils.messageBox("更新出牌信息失败", result.message);
            }
        });
    },
    initShowdown(self) {
        global.net.getShowdownInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.updateShowdown(self, result.data)
            } else {
                utils.messageBox("更新亮牌信息失败", result.message);
            }
        });
    },
    updateTurn(self, data) {
        let currentTurn = data.currentTurn;

        // 更新出牌信息
        if (!currentTurn) {
            return;
        }

        // 处理自动出牌
        let myCards = self.node.getChildByName("myCards");
        for (let card of data.playedCards) {
            for (let i = myCards.children.length - 1; i >= 0; i--) {
                let pokerCard = myCards.children[i].getComponent("pokerCard");
                if (pokerCard.number === card.number && pokerCard.suit === card.suit) {
                    myCards.children[i].destroy();
                }
                pokerCard.setDefault();
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
                // 将桌牌复制一份用于动画过度
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
        for (let i = 0; i < data.pointCards.length; i++) {
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
                for (let j = 0; j < data.pointCards[i].length; j++) {
                    let localExist = false;
                    for (let card of self.localPointCards[i]) {
                        if (card.suit === data.pointCards[i][j].suit && card.number === data.pointCards[i][j].number) {
                            localExist = true;
                            break;
                        }
                    }
                    if (localExist) {
                        continue;
                    }
                    self.localPointCards[i].push(data.pointCards[i][j]);
                    let showCard = cc.instantiate(self.smallPokerDemo);
                    let pokerScript = showCard.getComponent("pokerCard");
                    pokerScript.init(data.pointCards[i][j].suit, data.pointCards[i][j].number);
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
                utils.messageBox("提示", result.message);
            }
        });
    },
    showdownClick(event, data) {
        let self = this;
        let myCards = self.node.getChildByName("myCards");
        let selectedCard = [];
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");

            if (pokerCard.isTouched) {
                selectedCard.push({suit: pokerCard.suit, number: pokerCard.number});
            }
        }

        if (selectedCard.length <= 0) {
            utils.messageBox("提示", "请选择要亮的牌");
            return;
        }

        global.net.showdown(selectedCard, function (result) {
            if (result.success === "1") {
                for (let i = myCards.children.length - 1; i >= 0; i--) {
                    let pokerCard = myCards.children[i].getComponent("pokerCard");
                    pokerCard.setDefault();
                }
                self.node.getChildByName("btnShowdown").active = false;
                self.node.getChildByName("btnDoNotShowdown").active = false;
            } else {
                utils.messageBox("失败", result.message);
            }
        });
    },
    notShowdownClick(event, data) {
        let self = this;
        let myCards = self.node.getChildByName("myCards");
        global.net.showdown([], function (result) {
            if (result.success === "1") {
                for (let i = myCards.children.length - 1; i >= 0; i--) {
                    let pokerCard = myCards.children[i].getComponent("pokerCard");
                    pokerCard.setDefault();
                }
                self.node.getChildByName("btnShowdown").active = false;
                self.node.getChildByName("btnDoNotShowdown").active = false;
            } else {
                utils.messageBox("失败", result.message);
            }
        });
    },
    gameOver(self, data) {
        utils.messageBox("本轮结束", JSON.stringify(data), function () {
            self.isInitCards = false;
            self.roomStatus = 0;
            self.myPosition = 0;
            self.localTurnCards = [];
            self.localPointCards = [];
            self.node.getChildByName("showdownSouth").destroyAllChildren();
            self.node.getChildByName("showdownEast").destroyAllChildren();
            self.node.getChildByName("showdownNorth").destroyAllChildren();
            self.node.getChildByName("showdownWest").destroyAllChildren();

            self.node.getChildByName("pointCardsSouth").destroyAllChildren();
            self.node.getChildByName("pointCardsEast").destroyAllChildren();
            self.node.getChildByName("pointCardsNorth").destroyAllChildren();
            self.node.getChildByName("pointCardsWest").destroyAllChildren();

            self.node.getChildByName("myCards").removeAllChildren(true);

            self.onLoad();
            self.updateRoom();
        });
    }
});
