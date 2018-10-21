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
        isGameStart: false
    },
    onLoad() {
        let self = this;
        this.schedule(function () {
            let notify = global.notifyQueue.shift();
            if (notify) {
                switch (notify.type) {
                    case "updateRoom":
                        this.updateInfo();
                        break;
                    case "updateTurn":
                        this.updateTurn(self, notify.data);
                        break;
                }
            }
        }, 1);
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
    sortUserList(userList) {
        let me = -1;
        for (let i = 0; i < userList.length; i++) {
            if (userList[i].unionId === global.loginInfo.unionId) {
                me = i;
                break;
            }
        }

        if (me >= 0) {
            let newList = [{}, {}, {}, {}];
            for (let i = 0; i < userList.length; i++) {
                let newIndex = me - i;
                if (newIndex < 0) {
                    newIndex += 4;
                }

                newList[newIndex] = userList[i];
            }

            return newList;
        } else {
            return userList;
        }
    },
    updateInfo: function () {
        let self = this;
        global.net.getRoomInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.playerInfos.forEach(function (e) {
                    e.active = false;
                });

                let newUserList = self.sortUserList(result.data.userList);

                if (result.data.status === 1) {
                    self.initCards(self);
                }

                newUserList.forEach(function (e, i) {
                    if (e.nickName) {
                        let playerInfo = self.playerInfos[i].getComponent("playerInfo");
                        self.playerInfos[i].active = true;
                        if (e.isOnline === 0) {
                            e.nickName = e.nickName + "(断线)";
                        }

                        playerInfo.init(e.nickName, e.money, e.unionId);

                        playerInfo.setReadyStatus(result.data.status === 0 && e.status === 1);

                        if (i === 0) {
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
                utils.messageBox("错误", result.message, function () {
                });
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
                let posX = -300;
                let myCards = self.node.getChildByName("myCards");
                myCards.removeAllChildren(true);
                result.data.forEach(function (e, i) {
                    let showCard = cc.instantiate(self.pokerDemo);
                    let pokerScript = showCard.getComponent("pokerCard");
                    pokerScript.init(e.suit, e.number);
                    showCard.parent = myCards;
                });
                self.isGameStart = true;
            } else {
                utils.messageBox("失败", result.message, function () {
                });
            }

            self.initTurn(self);
        });
    },
    initTurn(self) {
        global.net.getTurnInfo(global.roomNo, function (result) {
            if (result.success === "1") {
                self.updateTurn(self, result.data)
            } else {
                utils.messageBox("失败", result.message, function () {
                });
            }
        });
    },
    updateTurn(self, data) {
        console.log(data);

        for (let i = 0; i < self.playerInfos.length; i++) {
            let playerInfo = self.playerInfos[i].getComponent("playerInfo");

            if (data.turnPlayer === playerInfo.unionId) {
                playerInfo.setCountdown(data.turnTimeout);
            }
        }

        if (data.turnPlayer == global.loginInfo.unionId) {
            let myCards = self.node.getChildByName("myCards");
            for (let i = 0; i < myCards.children.length; i++) {
                let pokerCard = myCards.children[i].getComponent("pokerCard");
                pokerCard.canTouch = true;
            }
        }
    }
});
