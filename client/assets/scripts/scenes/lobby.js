import global from '../global'
import utils from '../utils'

cc.Class({
    extends: cc.Component,
    properties: {
        nickname: cc.Label,
        money: cc.Label,
        roomCount: cc.Label,
        onlineCount: cc.Label,
        currentPage: 1,
        roomLayout: cc.Layout,
        roomBoxList: []
    },
    onLoad() {
        this.schedule(function () {
            if(global.lobbyNeedUpdate == 1){
                this.updateInfo();
            }
        }, 1);
    },
    start() {
        if (!global.net.socket) {
            cc.director.loadScene("login");
            return;
        }

        let resUrl = "prefabs/roomBox";
        let self = this;
        cc.loader.loadRes(resUrl, function (err, prefab) {
            if (err) {
                return;
            }
            for (let i = 1; i <= 20; i++) {
                let roomBoxPrefab = cc.instantiate(prefab);
                let roomBox = roomBoxPrefab.getComponent("roomBox");
                roomBox.init("", "", "");
                roomBoxPrefab.active = false;
                self.roomLayout.node.addChild(roomBoxPrefab);
                self.roomBoxList.push(roomBoxPrefab);
            }
            self.updateInfo();

            // 检查是否断线重连
            global.net.checkReconnectRoom(function (result) {
                if (result.success == "1") {
                    global.roomNo = result.data;
                    cc.director.loadScene("game");
                }
            });
        });
    },
    roomCountNumber: 0,
    setButton: function (enabled) {
        this.node.children.forEach(function (e) {
            let btn = e.getComponent(cc.Button);
            if (btn) {
                btn.interactable = enabled;
            }
        });
    },
    updateInfo: function () {
        let self = this;
        self.setButton(false);
        global.net.getLobbyInfo(this.currentPage, function (result) {
            if (result.success == "1") {
                global.loginInfo = result.data.loginInfo;
                self.nickname.string = global.loginInfo.nickName;
                self.money.string = global.loginInfo.money;
                self.roomCount.string = "房间数：" + result.data.roomCount;
                self.onlineCount.string = "在线人数：" + result.data.onlineCount;
                self.roomCountNumber = result.data.roomCount;

                self.roomBoxList.forEach(function (e, i) {
                    e.active = false;
                });

                result.data.rooms.forEach(function (e, i) {
                    let roomIndex = (e.no - 1) % 20;
                    let roomBox = self.roomBoxList[roomIndex].getComponent("roomBox");
                    roomBox.init(e.no, e.players.length, e.status);
                    self.roomBoxList[roomIndex].active = true;
                });
                self.setButton(true);
                global.lobbyNeedUpdate = 0;
            } else {
                utils.messageBox("错误", result.message, function () {
                    global.net.disconnect();
                });
            }
        });
    },
    prevButtonClick(event, data) {
        if (this.currentPage - 1 > 0) {
            this.currentPage -= 1;
        }
        this.updateInfo();
    },
    nextButtonClick(event, data) {
        if (this.currentPage * 20 < this.roomCountNumber) {
            this.currentPage += 1;
        }
        this.updateInfo();
    },
    createRoomClick(event, data) {
        let self = this;
        self.setButton(false);
        let roomType = 1;
        global.net.createRoom(roomType, function (result) {
            if (result.success == "1") {
                global.roomNo = result.data.no;
                cc.director.loadScene("game");
            } else {
                self.setButton(true);
                utils.messageBox("失败", result.message, function () {
                    self.updateInfo();
                });
            }
        });
    },
    quickJoinClick(event, data) {
        let self = this;
        self.setButton(false);
        global.net.quickJoinRoom(function (result) {
            if (result.success == "1") {
                global.roomNo = result.data;
                cc.director.loadScene("game");
            } else {
                self.setButton(true);
                utils.messageBox("失败", result.message, function () {
                    self.updateInfo();
                });
            }
        });
    },
});
