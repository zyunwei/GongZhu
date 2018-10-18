import db from './db';

const userDal = {
    doQuery(sql, params, callback) {
        db.con(function (err, connection) {
            if (err) {
                callback(err);
                return;
            }
            connection.query(sql, params,
                function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    callback(null, result);
                })
        });
    },
    getUserById(id, callback) {
        let sql = 'SELECT * FROM users WHERE unionId = ?;';
        this.doQuery(sql, id, callback);
    },
    insertUser(user, callback) {
        let sql = 'INSERT INTO users (unionId, nickName, gender, city, province, country, avatarUrl, ' +
            'updateTime, updateIp) ' +
            'VALUES (?,?,?,?,?,?,?,NOW(),?);';
        this.doQuery(sql, [user.unionId, user.nickName, user.gender, user.city, user.province,
            user.country, user.avatarUrl, user.updateIp], callback);
    },
    updateUser(user, callback){
        let sql = 'UPDATE users SET nickName = ?, gender = ?, city = ?, province = ?, country = ?, ' +
            'avatarUrl = ?, updateTime = NOW(), updateIp = ? ' +
            'WHERE unionId = ?';
        this.doQuery(sql, [user.nickName, user.gender, user.city, user.province, user.country,
            user.avatarUrl, user.updateIp, user.unionId], callback);
    }
};

export default userDal;