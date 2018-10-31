import global from './global';
import userManager from './managers/userManager';
import gameManager from './managers/gameManager';
import cardManager from "./managers/cardManager";

const io = require('socket.io')(3000);

global.io = io;
global.logger.info("服务器已启动");

// 服务端倒计时控制
setInterval(function () {
    for (let room of global.rooms) {
        if (room.status === 0 && room.players.length >= 4) {
            // 准备倒计时
            let toBeKicked = [];
            if (room.readyCountdown > 0) {
                room.readyCountdown -= 1;
            } else {
                // 把超时没有准备的人踢出房间
                for (let player of room.players) {
                    if (player.status !== 1) {
                        toBeKicked.push(player);
                    }
                }
            }
            for (let player of toBeKicked) {
                userManager.forceKickOut(player, room);
            }
        }
    }

    for (let game of global.games) {
        let room = gameManager.getRoomByRoomNo(game.roomNo);
        if (room == null) continue;

        if (room.status === 1) {
            // 亮牌倒计时
            let forceShowdown = [];
            if (room.showdownCountdown > 0) {
                room.showdownCountdown -= 1;
            }
            else {
                for (let player of game.players) {
                    if (game.isShowdown !== 1) {
                        forceShowdown.push(player);
                    }
                }
            }
            for (let player of forceShowdown) {
                // 超时默认不亮牌
                gameManager.showdown(game, player.unionId, []);
            }
        }

        if (room.status === 2 && game.currentTurn) {
            // 出牌倒计时
            if (game.currentTurn.turnTimeout > 0) {
                game.currentTurn.turnTimeout -= 1;
            } else {
                gameManager.autoPlayTurn(game);
            }
        }
    }
}, 1000);

global.io.on('connection', function (socket) {
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

        let newRoom = userManager.createRoom(roomType);
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
            userManager.joinRoom(onlineUser.unionId, newRoom.no);
        }

        response(result);
    });

    socket.on('exitRoom', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            userManager.exitRoom(onlineUser.unionId, roomNo);
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
            if (!userManager.joinRoom(onlineUser.unionId, roomNo)) {
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

            if (roomNo <= 0 || !userManager.joinRoom(onlineUser.unionId, roomNo)) {
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
                    if (global.rooms[i].players[j].unionId === onlineUser.unionId) {
                        // 断线重连加入
                        global.rooms[i].players[j].isOnline = 1;
                        global.rooms[i].players[j].socketId = socket.id;
                        let roomNo = global.rooms[i].no;
                        socket.leaveAll();
                        socket.join("room" + roomNo);
                        socket.in("lobby").emit("notify", {type: "updateLobby"});
                        socket.in("room" + roomNo).emit("notify", {type: "updateRoom"});

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
        let round = 0;
        let readyCountdown = 0;
        let showdownCountdown = 0;

        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no !== roomNo) continue;
            status = global.rooms[i].status;
            round = global.rooms[i].round;
            readyCountdown = global.rooms[i].readyCountdown;
            showdownCountdown = global.rooms[i].showdownCountdown;

            for (let j = 0; j < global.rooms[i].players.length; j++) {
                let user = global.rooms[i].players[j];
                userList.push({
                    unionId: user.unionId,
                    isOnline: user.isOnline,
                    money: user.money,
                    nickName: user.nickName,
                    status: user.status
                });
            }
            break;
        }

        if (userList.length > 0) {
            result.success = "1";
            result.message = "";
            result.data = {status, userList, roomNo, round, readyCountdown, showdownCountdown};
        }

        response(result);
    });

    socket.on('setReady', function (response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (onlineUser != null) {
            for (let i = 0; i < global.rooms.length; i++) {
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId === onlineUser.unionId) {
                        global.rooms[i].players[j].status = 1;

                        let readyCount = 0;
                        for (let k = 0; k < global.rooms[i].players.length; k++) {
                            if (global.rooms[i].players[k].status === 1) {
                                readyCount += 1;
                            }
                        }

                        // 全部准备 开始亮牌
                        if (readyCount >= 4) {
                            gameManager.startShowdown(global.rooms[i]);
                        }

                        global.io.in("room" + global.rooms[i].no).emit("notify", {type: "updateRoom"});
                        response({success: "1", message: "", data: {}});

                        return;
                    }
                }
            }
        }

        response({success: "0", message: "系统异常，请稍后再试"});
    });

    socket.on('getCardInfo', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (!onlineUser) {
            response({success: "0", message: "账号异常，请稍后再试"});
            return;
        }

        let cards = [];
        let game = gameManager.getGameByRoomNo(roomNo);
        if (game) {
            cards = gameManager.getCardByUnionId(game, onlineUser.unionId);
        }

        response({success: "1", message: "", data: cards});
    });

    socket.on('getShowdownInfo', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (!onlineUser) {
            response({success: "0", message: "账号异常，请稍后再试"});
            return;
        }

        let game = gameManager.getGameByRoomNo(roomNo);
        if (game) {
            response({success: "1", message: "", data: cardManager.getShowdownInfo(game)});
        } else {
            response({success: "0", message: "游戏信息异常，请稍后再试", data});
        }
    });

    socket.on('getTurnInfo', function (roomNo, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (!onlineUser) {
            response({success: "0", message: "账号异常，请稍后再试"});
            return;
        }

        let game = gameManager.getGameByRoomNo(roomNo);
        if (!game) {
            response({success: "0", message: "游戏信息异常，请稍后再试"});
            return;
        }

        response({success: "1", message: "", data: gameManager.getClientTurnInfo(game)});
    });

    socket.on('playCard', function (selectedCard, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (!onlineUser) {
            response({success: "0", message: "账号异常，请稍后再试"});
            return;
        }

        let room = userManager.getRoomByUnionId(onlineUser.unionId);
        if (!room) {
            response({success: "0", message: "房间信息异常，请稍后再试"});
            return;
        }

        let game = gameManager.getGameByRoomNo(room.no);
        if (!game) {
            response({success: "0", message: "游戏信息异常，请稍后再试"});
            return;
        }

        let checkResult = cardManager.checkPlayCard(game, onlineUser.unionId, selectedCard);
        if (checkResult.success !== "1") {
            response(checkResult);
            return;
        }

        if (!gameManager.playCard(game, onlineUser.unionId, selectedCard)) {
            response({success: "0", message: "游戏数据异常，请稍后再试"});
            return;
        }

        global.io.in("room" + room.no).emit("notify", {
            type: "updateTurn",
            data: gameManager.getClientTurnInfo(game)
        });

        response({success: "1", message: "", data: {}});
    });

    socket.on('showdown', function (selectedCard, response) {
        let onlineUser = userManager.getCurrentUser(socket.id);
        if (!onlineUser) {
            response({success: "0", message: "账号异常，请稍后再试"});
            return;
        }

        let room = userManager.getRoomByUnionId(onlineUser.unionId);
        if (!room || room.status !== 1) {
            response({success: "0", message: "房间信息异常，请稍后再试"});
            return;
        }

        let game = gameManager.getGameByRoomNo(room.no);
        if (!game) {
            response({success: "0", message: "游戏信息异常，请稍后再试"});
            return;
        }

        if (!gameManager.showdown(game, onlineUser.unionId, selectedCard)) {
            response({success: "0", message: "游戏数据异常，请稍后再试"});
            return;
        }

        response({success: "1", message: "", data: {}});
    });
});