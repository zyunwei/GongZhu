import userDal from '../dal/userDal';
import global from "../global";

const userManager = {
    checkOnlineUser(userInfo){
        // 检查在线用户，防止重复登录
        global.onlineUsers.some(function (e, i) {
            if (e.unionId == userInfo.unionId) {
                console.log("用户重复登录:" + userInfo.unionId);
                userManager.userDisconnect(userInfo.socketId);
            }
        });
        let flag = -1;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId == userInfo.socketId) {
                flag = i;
                return;
            }
        });
        if (flag >= 0) {
            global.onlineUsers.splice(flag, 1);
            console.log("当前用户数：" + global.onlineUsers.length);
        }
    },
    userDisconnect(socketId) {
        // 用户网络断开处理
        let flag = -1;
        global.onlineUsers.some(function (e, i) {
            if (e.socketId == socketId) {
                flag = i;
                return;
            }
        });
        if (flag >= 0) {
            global.onlineUsers.splice(flag, 1);
            console.log("当前用户数：" + global.onlineUsers.length);
        }
    },
    userLogin(userInfo, callback) {
        // 用户登录
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