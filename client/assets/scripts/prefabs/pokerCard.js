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
        suit: '',
        number: 0,
        canTouch: false,
        isTouched: false,
        disabled : false
    },
    onLoad() {
        this.handleControl();
    },
    start() {

    },
    init(suit, number) {
        this.suit = suit;
        this.number = number;
        if (number < 10) {
            number = '0' + number;
        }
        let self = this;
        let suitImg = 'poker/_' + suit;
        let numberImg = 'poker/';
        numberImg += suit === 'heart' || suit === 'diamond' ? 'r' : 'b';
        numberImg += number;
        cc.loader.loadRes(suitImg, cc.SpriteFrame, function (err, sprite) {
            self.pokerSuit.getComponent(cc.Sprite).spriteFrame = sprite;
        });

        cc.loader.loadRes(numberImg, cc.SpriteFrame, function (err, sprite) {
            self.pokerNumber.getComponent(cc.Sprite).spriteFrame = sprite;
        });

        this.setDisableMask(false);
    },
    setDisableMask(isDisabled){
        this.node.getChildByName("disableMask").active = isDisabled;
    },
    handleControl() {
        let self = this;
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (self.canTouch) {
                self.handleResponse(self.isTouched);
                self.isTouched = !self.isTouched;
            }
        }, this);
    },
    handleResponse(isTouched) {
        if (isTouched) {
            this.node.runAction(cc.moveBy(0.2, 0, -30));
        } else {
            this.node.runAction(cc.moveBy(0.2, 0, 30));
        }
    }
});
