import defines from 'defines.js'

const SocketController = function () {
    let that = {};
    let _socket = undefined;
    that.init = function () {
        _socket = io(defines.serverUrl);
    };
    that.login = function (userInfo) {
        _socket.emit('login', userInfo)
    }
    return that;
}
export default SocketController;