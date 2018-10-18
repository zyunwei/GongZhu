import global from './global';
import userManager from './managers/userManager';

const io = require('socket.io')(3000);

global.logger.info("服务器已启动");

io.on('connection', function (socket) {
    socket.on('message', function (data) {
        console.log(data);
        socket.emit('message', '拱猪服务器已连接')
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
        userManager.userDisconnect(socket.id);
    });

    socket.on('login', function (userInfo, response) {
        userInfo.updateIp = socket.request.connection.remoteAddress;
        userManager.userLogin(userInfo, function (err, result) {
            if (err) {
                global.logger.error(err);
                response("failed");
            } else {
                let onlineUser = {
                    unionId: result.unionId,
                    nickName: result.nickName,
                    money: 5000,
                    socketId:socket.id
                };
                userManager.checkOnlineUser(onlineUser);
                global.onlineUsers.push(onlineUser);
                //console.log(onlineUser);
                console.log("当前用户数：" + global.onlineUsers.length);
                response("success");
            }
        })
    });
});