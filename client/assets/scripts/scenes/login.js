import global from '../global'
import utils from '../utils'

cc.Class({
    extends: cc.Component,

    properties: {},
    start() {
        global.net.init();
    },
    update(dt) {
    },
    onLogin(userInfo) {
        let nodeLabel = this.node.getChildByName("lblTitle");
        if (nodeLabel != null) {
            nodeLabel.getComponent(cc.Label).string = "正在登录..";
        }
        // 禁用按钮
        this.node.children.forEach(function (e) {
            let btn = e.getComponent(cc.Button);
            if (btn) {
                btn.interactable = false;
            }
        });
        global.net.login(userInfo, function (err, result) {
            if (err) {
                console.log(err);
                utils.messageBox("错误", err);
            } else {
                cc.director.loadScene("lobby");
            }
        });
    },
    loginButtonClick(event, data) {
        switch (data) {
            case "login1":
                let userInfo1 = utils.cloneObj(global.testUserInfo1);
                this.onLogin(userInfo1);
                break;
            case "login2":
                let userInfo2 = utils.cloneObj(global.testUserInfo2);
                this.onLogin(userInfo2);
                break;
            case "login3":
                let userInfo3 = utils.cloneObj(global.testUserInfo3);
                this.onLogin(userInfo3);
                break;
            case "login4":
                let userInfo4 = utils.cloneObj(global.testUserInfo4);
                this.onLogin(userInfo4);
                break;
        }
    },
});
