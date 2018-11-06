cc.Class({
    extends: cc.Component,

    properties: {
        lblNickname: cc.Label,
        lblGold: cc.Label,
        lblCountDown: cc.Label,
        jsq: cc.Node,
        unionId: "",
        countdownNumber: -1,
        headImage: {
            default: null,
            type: cc.Sprite
        },
        headImageUrl: ''
    },
    start() {
        this.setCountdown(-1);
        this.schedule(function () {
            if (this.countdownNumber > 0) {
                this.countdownNumber -= 1;
                this.lblCountDown.string = this.countdownNumber;
            }
        }, 1);

        if(this.headImage && this.headImageUrl)
        {
            let headImage = this.headImage;
            cc.loader.load({
                url: this.headImageUrl,
                type: 'jpg'
            }, (err, tex) => {
                if (!err) {
                    headImage.spriteFrame = new cc.SpriteFrame(tex);
                    headImage.node.scale = 61 / tex.width;
                } else{
                    console.log(err);
                }
            });
        }
    },
    init(nickname, gold, unionId, avatarUrl) {
        this.lblNickname.string = nickname;
        this.lblGold.string = gold;
        this.unionId = unionId;
        this.setReadyStatus(false);
        this.headImageUrl = avatarUrl;
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
