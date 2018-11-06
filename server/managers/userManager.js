import userDal from '../dal/userDal';
import global from "../global";

const userManager = {
    checkOnlineUser(userInfo) {
        let success = true;
        for (let i = 0; i < global.onlineUsers.length; i++) {
            if (global.onlineUsers[i].unionId === userInfo.unionId ||
                global.onlineUsers[i].socketId === userInfo.socketId) {
                console.log("用户重复登录:" + userInfo.unionId);
                success = false;
            }
        }

        return success;
    },
    getUserByUnionId(unionId) {
        let onlineUser = null;
        global.onlineUsers.some(function (e, i) {
            if (e.unionId === unionId) {
                onlineUser = e;
            }
        });
        return onlineUser;
    },
    getCurrentUser(socketId) {
        let onlineUser = null;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId === socketId) {
                onlineUser = e;
            }
        });
        return onlineUser;
    },
    getRoomByUnionId(unionId) {
        for (let i = 0; i < global.rooms.length; i++) {
            for (let j = 0; j < global.rooms[i].players.length; j++) {
                if (global.rooms[i].players[j].unionId === unionId) {
                    return global.rooms[i];
                    break;
                }
            }
        }
        return null;
    },
    userDisconnect(socket) {
        let flag = -1;
        let unionId = null;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId === socket.id) {
                flag = i;
                unionId = e.unionId;
            }
        });

        if (flag >= 0) {
            global.onlineUsers.splice(flag, 1);
        }

        if (unionId) {
            for (let i = 0; i < global.rooms.length; i++) {
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId === unionId) {
                        global.rooms[i].players[j].isOnline = 0;
                        socket.in("room" + global.rooms[i].no).emit("notify", {type: "updateRoom"});
                        break;
                    }
                }
            }
        }

        socket.in("lobby").emit("notify", {type: "updateLobby"});
    },
    userLogin(userInfo, callback) {
        userDal.getUserById(userInfo.unionId, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            let logInfo = userInfo.nickName + '[' + userInfo.unionId + ']';
            if (result && result.length === 0) {
                userInfo.gold = global.initGold;
                userDal.insertUser(userInfo, function (err, result) {
                    if (err) {
                        global.logger.error(err);
                        console.log("添加用户数据时失败");
                    }
                    if (result.affectedRows === 1) {
                        console.log("新用户 " + logInfo + " 已注册并登录");
                        callback(null, userInfo);
                    }
                });
            } else {
                console.log("用户 " + logInfo + " 登录");
                userDal.updateUser(userInfo, function (err, result) {
                    if (err) {
                        global.logger.error(err);
                        console.log("更新用户数据失败");
                    }

                    userDal.getUserById(userInfo.unionId, function (err, user) {
                        if (err) {
                            global.logger.error(err);
                            console.log("获取用户数据失败");
                        }

                        callback(null, user[0]);
                    });
                });
            }
        });
    },
    createRoom(roomType) {
        let roomNo = 1;
        for (roomNo = 1; roomNo < 100000; roomNo++) {
            let isOk = true;
            for (let i = 0; i < global.rooms.length; i++) {
                if (global.rooms[i].no === roomNo) {
                    isOk = false;
                    break;
                }
            }

            if (isOk) {
                break;
            }
        }

        let roomInfo = {
            no: roomNo,
            type: roomType,
            players: [],
            status: 0,
            round: 1,
            lastPig: -1,
            readyCountdown: 15,
            exposeCountdown: 8
        };

        global.rooms.push(roomInfo);
        return roomInfo;
    },
    joinRoom(unionId, roomNo) {
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no === roomNo) {
                // 如果存在相同ID，表示断线重连
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId === unionId) {
                        global.rooms[i].players[j].isOnline = 1;
                        return true;
                    }
                }

                if (global.rooms[i].players.length >= 4) {
                    return false;
                }
                let userInfo = userManager.getUserByUnionId(unionId);
                global.rooms[i].players.push(
                    {
                        unionId: userInfo.unionId,
                        nickName: userInfo.nickName,
                        gold: userInfo.gold,
                        status: 0,
                        isOnline: 1,
                        socketId: userInfo.socketId,
                        avatarUrl: userInfo.avatarUrl
                    });
                return true;
            }
        }
        return false;
    },
    exitRoom(unionId, roomNo) {
        let isOk = false;
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no === roomNo) {
                let slotIndex = -1;
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId === unionId) {
                        isOk = true;
                        slotIndex = j;
                        break;
                    }
                }
                if (isOk) {
                    global.rooms[i].readyCountdown = 15;
                    global.rooms[i].players.splice(slotIndex, 1);
                    this.checkRoomClose(roomNo);
                    return true;
                }
                break;
            }
        }

        return false;
    },
    checkRoomClose(roomNo) {
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no === roomNo) {
                if (global.rooms[i].players.length <= 0) {
                    global.rooms.splice(i, 1);
                }
                break;
            }
        }
    },
    forceKickOut(onlineUser, room) {
        if (this.exitRoom(onlineUser.unionId, room.no)) {
            let socket = global.io.sockets.connected[onlineUser.socketId];
            if (socket) {
                socket.emit("notify", {type: "leaveRoom"});
                socket.leaveAll();
                socket.join("lobby");
            }

            global.io.in("lobby").emit("notify", {type: "updateLobby"});
            global.io.in("room" + room.no).emit("notify", {type: "updateRoom"});
        }
    }
};

export default userManager;