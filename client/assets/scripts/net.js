import defines from './defines'
import utils from './utils'

const net = function () {
    let that = {};
    let _socket = undefined;

    that.socket = _socket;

    that.init = function () {
        _socket = io(defines.serverUrl);
        _socket.on('connect_error', (error) => {
            utils.messageBox("错误", "网络连接错误：" + error, function(){
                cc.director.loadScene("login");
            });
        });
    };
    that.login = function (userInfo, callback) {
        _socket.emit('login', userInfo, function (data) {
            if (data == "success") {
                callback(null, "");
            } else {
                callback("登录失败");
            }
        });
    }
    return that;
}
export default net;