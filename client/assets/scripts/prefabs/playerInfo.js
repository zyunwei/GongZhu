cc.Class({
    extends: cc.Component,

    properties: {
        lblNickname: cc.Label,
        lblGold: cc.Label,
        lblCountDown: cc.Label,
        jsq: cc.Node,
        unionId: "",
        countdownNumber: -1,
    },
    start() {
        this.setCountdown(-1);
        this.schedule(function () {
            if (this.countdownNumber > 0) {
                this.countdownNumber -= 1;
                this.lblCountDown.string = this.countdownNumber;
            }
        }, 1);
    },
    init(nickname, gold, unionId) {
        this.lblNickname.string = nickname;
        this.lblGold.string = gold;
        this.unionId = unionId;
        this.setReadyStatus(false);
    },
    setReadyStatus(ready) {
        this.node.getChildByName("ready").active = ready;
    },
    setCountdown(second) {
        this.countdownNumber = second;
        this.lblCountDown.string = second;
        if (second < 0) {
            this.lblCountDown.node.active = false;
            this.jsq.active = false;
        }
        else {
            this.lblCountDown.node.active = true;
            this.jsq.active = true;
        }
    }
});
