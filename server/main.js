import global from './global';
import userManager from './managers/userManager';
import gameManager from './managers/gameManager';

const io = require('socket.io')(3000);

global.logger.info("服务器已启动");

io.on('connection', function (socket) {
    socket.on('disconnect', function () {
        userManager.userDisconnect(socket);
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
                    money: 50000,
                    socketId: socket.id
                };
                if (!userManager.checkOnlineUser(onlineUser)) {
                    response("failed");
                    return;
                }
                global.onlineUsers.push(onlineUser);
                socket.in("lobby").emit("notify", {type: "updateLobby"});
                socket.join("lobby");
                console.log("当前用户数：" + global.onlineUsers.length);
                response("success");
            }
        });
    });

    socket.on('getLobbyInfo', function (pageIndex, response) {
        let result = {
            success: "0",
            message: "对不起，系统异常，请重新登录",
            data: {}
        };

        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            result.success = "1";
            result.message = "";
            result.data = {};
            result.data.loginInfo = onlineUser;
            result.data.onlineCount = global.onlineUsers.length;
            result.data.roomCount = global.rooms.length;
            result.data.rooms = global.rooms.slice((pageIndex - 1) * 20, pageIndex * 20);
        }

        response(result);
    });

    socket.on('createRoom', function (roomType, response) {
        let result = {
            success: "0",
            message: "对不起，系统异常，请稍后再试",
            data: {}
        };

        let newRoom = gameManager.createRoom(roomType);
        if (newRoom != null) {
            result.success = "1";
            result.message = "";
            result.data = newRoom;
        }

        socket.leaveAll();
        socket.join("room" + newRoom.no);
        socket.in("lobby").emit("notify", {type: "updateLobby"});

        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            gameManager.joinRoom(onlineUser.unionId, newRoom.no);
        }

        response(result);
    });

    socket.on('exitRoom', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            gameManager.exitRoom(onlineUser.unionId, roomNo);
        }

        socket.leaveAll();
        socket.join("lobby");
        socket.in("lobby").emit("notify", {type: "updateLobby"});
        socket.in("room" + roomNo).emit("notify", {type: "updateRoom"});

        response({success: "1", message: "", data: roomNo});
    });

    socket.on('joinRoom', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            if (!gameManager.joinRoom(onlineUser.unionId, roomNo)) {
                response({success: "0", message: "加入房间失败"});
                return;
            }
        }

        socket.leaveAll();
        socket.join("room" + roomNo);
        socket.in("lobby").emit("notify", {type: "updateLobby"});
        socket.in("room" + roomNo).emit("notify", {type: "updateRoom"});

        response({success: "1", message: "", data: roomNo});
    });

    socket.on('quickJoin', function (response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        let roomNo = 0;
        if (onlineUser != null) {
            for (let i = 0; i < global.rooms.length; i++) {
                if (global.rooms[i].players.length < 4) {
                    roomNo = global.rooms[i].no;
                    break;
                }
            }

            if (roomNo <= 0 || !gameManager.joinRoom(onlineUser.unionId, roomNo)) {
                response({success: "0", message: "加入房间失败"});
                return;
            }
        }

        if (roomNo > 0) {
            socket.leaveAll();
            socket.join("room" + roomNo);
            socket.in("lobby").emit("notify", {type: "updateLobby"});
            socket.in("room" + roomNo).emit("notify", {type: "updateRoom"});

            response({success: "1", message: "", data: roomNo});
        }
    });

    socket.on('checkReconnectRoom', function (response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            for (let i = 0; i < global.rooms.length; i++) {
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId == onlineUser.unionId) {
                        // 断线重连加入
                        global.rooms[i].players[j].isOnline = 1;
                        let roomNo = global.rooms[i].no;
                        socket.leaveAll();
                        socket.join("room" + roomNo);
                        socket.in("lobby").emit("notify", {type: "updateLobby"});
                        socket.in("room" + roomNo).emit("notify", {type: "updateRoom"});
                        console.log(onlineUser.unionId + " 断线重连后加入房间：" + roomNo);

                        response({success: "1", message: "", data: roomNo});
                        return;
                    }
                }
            }
        }

        response({success: "0", message: ""});
    });

    socket.on('getRoomInfo', function (roomNo, response) {
        let result = {
            success: "0",
            message: "对不起，系统异常，请重新登录",
            data: {}
        };

        let userList = [];
        let status = null;

        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no != roomNo) continue;
            status = global.rooms[i].status;
            userList = global.rooms[i].players;
            break;
        }

        if (userList.length > 0) {
            result.success = "1";
            result.message = "";
            result.data = {status, userList};
        }

        response(result);
    });

    socket.on('setReady', function (response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            for (let i = 0; i < global.rooms.length; i++) {
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId == onlineUser.unionId) {
                        global.rooms[i].players[j].status = 1;

                        // 全部准备即开始游戏
                        let readyCount = 0;
                        for (let k = 0; k < global.rooms[i].players.length; k++) {
                            if(global.rooms[i].players[k].status == 1){
                                readyCount += 1;
                            }
                        }

                        if(readyCount >= 4){
                            global.rooms[i].status = 1;
                            socket.in("lobby").emit("notify", {type: "updateLobby"});
                        }

                        io.in("room" + global.rooms[i].no).emit("notify", {type: "updateRoom"});
                        response({success: "1", message: "", data: {}});

                        return;
                    }
                }
            }
        }

        response({success: "0", message: "系统异常，请稍后再试"});
    });
});