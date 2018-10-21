cc.Class({
    extends: cc.Component,

    properties: {
        lblNickname: cc.Label,
        lblMoney: cc.Label,
        lblCountDown: cc.Label,
        jsq: cc.Node,
        unionId: ""
    },
    start() {
        this.setCountdown(0);
    },
    init(nickname, money, unionId) {
        this.lblNickname.string = nickname;
        this.lblMoney.string = money;
        this.unionId = unionId;
        this.setReadyStatus(false);
    },
    setReadyStatus(ready) {
        this.node.getChildByName("ready").active = ready;
    },
    setCountdown(second) {
        this.lblCountDown.string = second;
        if (second <= 0) {
            this.lblCountDown.node.active = false;
            this.jsq.active = false;
        }
        else {
            this.lblCountDown.node.active = true;
            this.jsq.active = true;
        }
    }
});
