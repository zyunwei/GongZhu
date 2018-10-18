import defines from './defines'
import utils from './utils'
import global from './global'

const net = function () {
    let that = {};
    let _socket = undefined;

    that.socket = _socket;
    that.isInit = false;

    that.disconnect = function () {
        _socket.close();
        cc.director.loadScene("login");
        return;
    };

    that.init = function () {
        _socket = io(defines.serverUrl);
        _socket.on('connect_error', (error) => {
            utils.messageBox("错误", "网络连接错误：" + error, function () {
                cc.director.loadScene("login");
            });
        });
        that.isInit = true;
    };

    that.login = function (userInfo, callback) {
        _socket.emit('login', userInfo, function (data) {
            if (data == "success") {
                global.loginInfo.unionId = userInfo.unionId;
                callback(null, "");
            } else {
                global.loginInfo = {};
                callback("登录失败");
            }
        });
    };

    that.getLobbyInfo = function (page, callback) {
        _socket.emit('getLobbyInfo', page, function (data) {
            callback(data);
        });
    };

    that.createRoom = function(roomType, callback){
        _socket.emit('createRoom', roomType, function (data) {
            callback(data);
        });
    }

    return that;
}
export default net;