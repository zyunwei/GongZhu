cc.Class({
    extends: cc.Component,

    properties: {
        pokerSuit: {
            default: null,
            type: cc.Sprite
        },
        pokerNumber: {
            default: null,
            type: cc.Sprite
        },
        canTouch: true,
        isTouched: false
    },
    onLoad() {
        this.handleControl();
    },
    start() {

    },
    init: function (suit, number) {
        if (number < 10) {
            number = '0' + number;
        }
        let self = this;
        let suitImg = 'poker/_' + suit;
        let numberImg = 'poker/';
        numberImg += suit == 'heart' || suit == 'diamond' ? 'r' : 'b';
        numberImg += number;
        cc.loader.loadRes(suitImg, cc.SpriteFrame, function (err, sprite) {
            self.pokerSuit.getComponent(cc.Sprite).spriteFrame = sprite;
        });

        cc.loader.loadRes(numberImg, cc.SpriteFrame, function (err, sprite) {
            self.pokerNumber.getComponent(cc.Sprite).spriteFrame = sprite;
        });
    },
    handleControl: function () {
        let self = this;
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (self.canTouch) {
                self.handleResponse(self.isTouched);
                self.isTouched = !self.isTouched;
            }
        }, this);
    },
    handleResponse: function (isTouched) {
        if(isTouched){
            this.node.runAction(cc.moveBy(0.2,0,-30));
        } else{
            this.node.runAction(cc.moveBy(0.2,0,30));
        }
    }
});
