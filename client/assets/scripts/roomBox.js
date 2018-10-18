cc.Class({
    extends: cc.Component,

    properties: {
        RoomNo: cc.Label,
        PlayerCount: cc.Label,
        Status: cc.Label
    },
    init(roomNo, playerCount, status) {
        let padToFour = roomNo <= 9999 ? ("000"+roomNo).slice(-4) : roomNo;
        this.RoomNo.string = padToFour;
        this.PlayerCount.string = playerCount + "/4";
        this.getComponent(cc.Button).clickEvents[0].customEventData = roomNo;

        switch(status){
            case 0:
                this.Status.string = "等待中";
                break;
            case 1:
                this.Status.string = "游戏中";
                break;
            case 2:
                this.Status.string = "已结束";
                break;
        }
    },
    start() {

    },
    enterRoom: function (event, data) {
        console.log("clicked enter room" + data);
    }
});
