import userDal from '../dal/userDal';
import global from "../global";

const userManager = {
    checkOnlineUser(userInfo){
        // 返回true检查通过 返回false禁止登录
        let success = true;
        for(let i = 0; i < global.onlineUsers.length; i++){
            if (global.onlineUsers[i].unionId == userInfo.unionId ||
                global.onlineUsers[i].socketId == userInfo.socketId) {
                console.log("用户重复登录:" + userInfo.unionId);
                success = false;
            }
        }

        return success;
    },
    getUserByUnionId(unionId){
        let onlineUser = null;
        global.onlineUsers.some(function (e, i) {
            if (e.unionId == unionId) {
                onlineUser = e;
            }
        });
        return onlineUser;
    },
    getCurrentUser(socketId){
        let onlineUser = null;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId == socketId) {
                onlineUser = e;
            }
        });
        return onlineUser;
    },
    userDisconnect(socket) {
        let flag = -1;
        let unionId = null;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId == socket.id) {
                flag = i;
                unionId = e.unionId;
                return;
            }
        });

        if (flag >= 0) {
            global.onlineUsers.splice(flag, 1);
        }

        if(unionId != null){
            for (let i = 0; i < global.rooms.length; i++) {
                for(let j = 0; j < global.rooms[i].players.length; j++){
                    if(global.rooms[i].players[j].unionId == unionId){
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
            if (result && result.length == 0) {
                userDal.insertUser(userInfo, function (err, result) {
                    if (err) {
                        global.logger.error(err);
                        console.log("添加用户数据时失败");
                    }
                    if (result.affectedRows == 1) {
                        console.log("新用户 " + logInfo + " 已注册并登录");
                        callback(null, userInfo);
                    }
                });
            } else {
                console.log("老用户 " + logInfo + " 登录");
                userDal.updateUser(userInfo, function (err, result) {
                    if (err) {
                        global.logger.error(err);
                        console.log("更新用户数据失败");
                    }
                });

                callback(null, userInfo);
            }
        });
    }
};

export default userManager;