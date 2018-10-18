import global from "../global";

cc.Class({
    extends: cc.Component,

    properties: {

    },
    start () {
        if (!global.net.isInit) {
            cc.director.loadScene("login");
            return;
        }
    },
    exitRoomClick(event, data) {
        cc.director.loadScene("lobby");
    },
});
