import global from '../global'

cc.Class({
    extends: cc.Component,

    properties: {},
    start() {
        global.socket.init();
    },
    update(dt) {
    },
    buttonClick(evt, data) {
        switch (data) {
            case "login":
                console.log(data);
                // todo: 调用微信接口获得用户数据
                let userInfo = {
                    unionId: '10000',
                    nickName: '小明',
                    gender: 1,
                    city: 'haidian',
                    province: 'beijing',
                    country: 'china',
                    avatarUrl: 'https://www.google.com',
                    updateTime: '',
                    updateIp: ''
                };
                global.socket.login(userInfo);
                let nodeLabel = this.node.getChildByName("lblTest");
                if(nodeLabel != null){
                    nodeLabel.getComponent(cc.Label).string = "正在登录..";
                }
                break;
        }
    },
});
