import global from '../global'
import utils from '../utils'
import defines from '../defines'

cc.Class({
    extends: cc.Component,

    properties: {
        lblTitle: cc.Label,
        startTitle: "欢迎来到拱猪游戏！"
    },
    start() {
        global.net.init();
        global.loginInfo = {};
    },
    onLoad() {
        // this.setButtonState(false);
        // this.schedule(function () {
        //     if (this.lblTitle.string !== this.startTitle && global.net.socket != null) {
        //         this.lblTitle.string = this.startTitle;
        //         this.setButtonState(true);
        //     }
        // }, 0.3);
    },
    setButtonState(enabled) {
        this.node.children.forEach(function (e) {
            let btn = e.getComponent(cc.Button);
            if (btn) {
                btn.interactable = enabled;
            }
        });
    },
    onLogin(userInfo) {
        let nodeLabel = this.node.getChildByName("lblTitle");
        if (nodeLabel != null) {
            nodeLabel.getComponent(cc.Label).string = "正在登录..";
        }
        // 禁用按钮
        this.setButtonState(false);
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
        let self = this;
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
            case "login5":
                let userInfo5 = utils.cloneObj(global.testUserInfo5);
                this.onLogin(userInfo5);
                break;
            case "login6":
                if (cc.sys.platform === cc.sys.WECHAT_GAME) {
                    wx.login({
                        success: function (res1) {
                            wx.request({
                                url: defines.serverUrl + '/wechatlogin',
                                data: {code: res1.code},
                                header: {
                                    'content-type': 'application/json'
                                },
                                success: function (res2) {
                                    let openId = res2.data.openid;
                                    let button = wx.createUserInfoButton({
                                        type: 'text',
                                        text: '确认授权',
                                        style: {
                                            left: 300,
                                            top: 150,
                                            width: 200,
                                            height: 40,
                                            lineHeight: 40,
                                            backgroundColor: '#0058ff',
                                            color: '#ffffff',
                                            textAlign: 'center',
                                            fontSize: 16,
                                            borderRadius: 4
                                        }
                                    });

                                    button.onTap((res3) => {
                                        let userInfo = JSON.parse(res3.rawData);
                                        userInfo.unionId = openId;
                                        self.onLogin(userInfo);
                                        button.destroy();
                                    });
                                }
                            })
                        }
                    });
                } else {
                    utils.messageBox("提示", "平台错误：" + cc.sys.platform + "，请在微信上登录");
                }
                break;
        }
    },
});
