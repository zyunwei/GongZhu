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
        isGameStart: false,
        isInitCards: false
    },
    onLoad() {
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
        }, 1);
        self.node.getChildByName("btnPlayCard").active = false;
    },
    start() {
        if (!global.net.socket) {
            cc.director.loadScene("login");
            return;
        }
        this.playerInfos.forEach(function (e) {
            e.active = false;
        });

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

                let myPosition = self.getMyPosition(result.data.userList);

                result.data.userList.forEach(function (e, i) {
                    let showIndex = i - myPosition;
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
    updateTurn(self, data) {
        console.log(data);

        for (let i = 0; i < self.playerInfos.length; i++) {
            let playerInfo = self.playerInfos[i].getComponent("playerInfo");
            playerInfo.setCountdown(0);
            if (data.turnPlayer === playerInfo.unionId) {
                playerInfo.setCountdown(data.turnTimeout);
            }
        }

        let isMyTurn = data.turnPlayer === global.loginInfo.unionId;
        let myCards = self.node.getChildByName("myCards");
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");
            pokerCard.canTouch = isMyTurn;
        }

        self.node.getChildByName("btnPlayCard").active = isMyTurn;

        let turnCards = self.node.getChildByName("turnCards");
        turnCards.removeAllChildren();

        for (let i = 0; i < data.turnCards.length; i++) {
            for (let j = 0; j < data.turnCards[i].length; j++) {
                let showCard = cc.instantiate(self.pokerDemo);
                let pokerScript = showCard.getComponent("pokerCard");
                pokerScript.init(data.turnCards[i][j].suit, data.turnCards[i][j].number);
                turnCards.addChild(showCard);
            }
        }

    },
    playCardClick(event, data) {
        let self = this;
        let myCards = self.node.getChildByName("myCards");
        let selectedCard = [];
        for (let i = 0; i < myCards.children.length; i++) {
            let pokerCard = myCards.children[i].getComponent("pokerCard");

            if (pokerCard.isTouched) {
                selectedCard.push({suit: pokerCard.suit, number: pokerCard.number});
            }
        }

        if (selectedCard.length === 0) {
            utils.messageBox("提示", "请选择要出的牌");
            return;
        }

        if (selectedCard.length > 1) {
            utils.messageBox("提示", "您只能选择一张牌");
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
