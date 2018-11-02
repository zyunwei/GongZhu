cc.Class({
    extends: cc.Component,

    properties: {
        PlayerName: [cc.Label,cc.Label,cc.Label,cc.Label],
        Score: [cc.Label,cc.Label,cc.Label,cc.Label]
    },
    okCallback:undefined,
    init(results, callback) {
        this.okCallback = callback;
        for(let i = 0; i <  results.length; i++){
            if(this.PlayerName[i]){
                this.PlayerName[i].string = results[i].nickName;
            }
            if(this.Score[i]){
                this.Score[i].string = results[i].gold > 0 ? "+" + results[i].gold : results[i].gold;
            }
        }
    },
    start() {

    },
    ok: function (event, customEventData) {
        if(typeof(this.okCallback) !== "undefined"){
            this.okCallback();
        }
        this.node.destroy();
    }
});
