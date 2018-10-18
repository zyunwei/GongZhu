cc.Class({
    extends: cc.Component,

    properties: {
        Title: cc.Label,
        Text: cc.Label
    },
    okCallback:undefined,
    init(title, text, callback) {
        this.Title.string = title;
        this.Text.string = text;
        this.okCallback = callback;
    },
    start() {

    },
    close: function (event, customEventData) {
        this.node.destroy();
    },
    ok: function (event, customEventData) {
        if(typeof(this.okCallback) != "undefined"){
            this.okCallback();
        }
        else this.node.destroy();
    }
});
