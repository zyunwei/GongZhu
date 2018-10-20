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
    },
    start() {

    },
    init: function (suit, number) {
        if(number < 10) {
            number = '0' + number;
        }
        console.log(number);
        let self = this;
        let suitImg = 'poker/_' + suit;
        let numberImg = 'poker/';
        numberImg += suit == 'heart' || suit == 'diamond' ? 'r' : 'b';
        numberImg += number;
        cc.loader.loadRes(suitImg, cc.SpriteFrame, function(err,sprite){
            self.pokerSuit.getComponent(cc.Sprite).spriteFrame = sprite;
        });

        cc.loader.loadRes(numberImg, cc.SpriteFrame, function(err,sprite){
            self.pokerNumber.getComponent(cc.Sprite).spriteFrame = sprite;
        });
    }
});
