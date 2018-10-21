cc.Class({
    extends: cc.Component,

    properties: {
        Title: cc.Label,
        Content: cc.Label
    },
    okCallback:undefined,
    init(title, text, callback) {
        this.Title.string = title;
        this.Content.string = text;
        this.okCallback = callback;
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
