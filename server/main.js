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
    });

    socket.on('login', function (userInfo) {
        userInfo.updateIp = socket.request.connection.remoteAddress;
        userManager.userLogin(userInfo, function (err, result) {
            if (err) {
                global.logger.error(err);
            } else{
                global.onlineUsers.push(result);
                global.logger.info("当前用户数：" + global.onlineUsers.length);
            }
        })
    });
});