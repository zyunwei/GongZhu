import userDal from '../dal/userDal';
import global from "../global";

const userManager = {
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
                    if(result.affectedRows == 1){
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