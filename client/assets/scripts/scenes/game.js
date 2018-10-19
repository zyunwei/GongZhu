import global from "../global";
import utils from "../utils";

cc.Class({
    extends: cc.Component,

    properties: {

    },
    start () {
        if (!global.net.socket) {
            cc.director.loadScene("login");
            return;
        }
    },
    exitRoomClick(event, data) {
        global.net.exitRoom(global.roomNo, function (result) {
            cc.director.loadScene("lobby");
        });
    },
});
