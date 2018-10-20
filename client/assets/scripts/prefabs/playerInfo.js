cc.Class({
    extends: cc.Component,

    properties: {
        lblNickname : cc.Label,
        lblMoney: cc.Label,
    },
    start () {

    },
    init(nickname, money) {
        this.lblNickname.string = nickname;
        this.lblMoney.string = money;
        this.setReadyStatus(false);
    },
    setReadyStatus(ready){
        this.node.getChildByName("ready").active = ready;
    }
});
