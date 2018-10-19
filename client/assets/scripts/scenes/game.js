import global from "../global";
import utils from "../utils";

cc.Class({
    extends: cc.Component,

    properties: {
        playerInfos:{
            default:[],
            type:[cc.Node]
        }
    },
    onLoad() {
        this.schedule(function () {
            let notify = global.notifyQueue.shift();
            if(notify){
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
        this.playerInfos.forEach(function(e){
            e.active = false;
        });

        this.updateInfo();
    },
    exitRoomClick(event, data) {
        global.net.exitRoom(global.roomNo, function (result) {
            cc.director.loadScene("lobby");
        });
    },
    updateInfo: function () {
        let self = this;
        global.net.getRoomInfo(global.roomNo, function (result) {
            if (result.success == "1") {
                self.playerInfos.forEach(function(e){
                    e.active = false;
                });

                result.data.userList.forEach(function (e, i) {
                    let playerInfo = self.playerInfos[i].getComponent("playerInfo");
                    self.playerInfos[i].active = true;
                    playerInfo.init(e.nickName, e.money);
                });
            } else {
                utils.messageBox("错误", result.message, function () {});
            }
        });
    },
});
