import defines from './defines'
import utils from './utils'
import global from './global'
import io from 'socket.io-client';

const net = function () {
    let that = {};
    let _io = null;

    that.socket = null;

    that.disconnect = function () {
        _io.close();
        cc.director.loadScene("login");
    };

    that.init = function () {
        _io = io(defines.serverUrl);
        _io.on('connect_error', (error) => {
            utils.messageBox("错误", "网络连接错误：" + error, function () {
                cc.director.loadScene("login");
            });
        });

        _io.on('connect', function(){
            that.socket = _io;
        });

        _io.on("notify", function (data) {
            console.log("notify:" + JSON.stringify(data) + Math.random());
            switch(data.type){
                case "updateLobby":
                    global.lobbyNeedUpdate = 1;
                    break;
                default:
                    global.notifyQueue.push(data);
                    break;
            }
        });
    };

    that.login = function (userInfo, callback) {
        that.socket.emit('login', userInfo, function (data) {
            if (data == "success") {
                global.loginInfo.unionId = userInfo.unionId;
                callback(null, "");
            } else {
                global.loginInfo = {};
                callback("您已在其他设备登录");
            }
        });
    };

    that.getLobbyInfo = function (page, callback) {
        that.socket.emit('getLobbyInfo', page, function (data) {
            callback(data);
        });
    };

    that.createRoom = function(roomType, callback){
        that.socket.emit('createRoom', roomType, function (data) {
            callback(data);
        });
    }

    that.exitRoom = function(roomNo, callback){
        that.socket.emit('exitRoom', roomNo, function (data) {
            callback(data);
        });
    }

    that.joinRoom = function(roomNo, callback){
        that.socket.emit('joinRoom', roomNo, function (data) {
            callback(data);
        });
    }

    that.quickJoinRoom = function(callback){
        that.socket.emit('quickJoin', function (data) {
            callback(data);
        });
    }

    that.checkReconnectRoom = function(callback){
        that.socket.emit('checkReconnectRoom', function (data) {
            callback(data);
        });
    }

    that.getRoomInfo = function(roomNo, callback){
        that.socket.emit('getRoomInfo', roomNo, function (data) {
            callback(data);
        });
    }

    return that;
}
export default net;