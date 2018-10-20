import global from "../global";
import utils from "../utils";

cc.Class({
    extends: cc.Component,

    properties: {
        playerInfos: {
            default: [],
            type: [cc.Node]
        }
    },
    onLoad() {
        this.schedule(function () {
            let notify = global.notifyQueue.shift();
            if (notify) {
                switch (notify.type) {
                    case "updateRoom":
                        this.updateInfo();
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
            if (userList[i].unionId == global.loginInfo.unionId) {
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
            if (result.success == "1") {
                self.playerInfos.forEach(function (e) {
                    e.active = false;
                });

                let newUserList = self.sortUserList(result.data.userList);
                console.log(newUserList);
                newUserList.forEach(function (e, i) {
                    if (e.nickName) {
                        let playerInfo = self.playerInfos[i].getComponent("playerInfo");
                        self.playerInfos[i].active = true;
                        if(e.isOnline == 0){
                            e.nickName = e.nickName + "(断线)";
                        }
                        playerInfo.init(e.nickName, e.money);
                    }
                });
            } else {
                utils.messageBox("错误", result.message, function () {
                });
            }
        });
    },
});
