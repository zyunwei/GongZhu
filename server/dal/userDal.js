import db from './db';

const userDal = {
    getUserById(id, callback) {
        let sql = 'SELECT * FROM users WHERE unionId = ?;';
        db.doQuery(sql, id, callback);
    },
    insertUser(user, callback) {
        let sql = 'INSERT INTO users (unionId, nickName, gender, city, province, country, avatarUrl, ' +
            'updateTime, updateIp, gold) ' +
            'VALUES (?,?,?,?,?,?,?,NOW(),?,?);';
        db.doQuery(sql, [user.unionId, user.nickName, user.gender, user.city, user.province,
            user.country, user.avatarUrl, user.updateIp, user.gold], callback);
    },
    updateUser(user, callback){
        let sql = 'UPDATE users SET nickName = ?, gender = ?, city = ?, province = ?, country = ?, ' +
            'avatarUrl = ?, updateTime = NOW(), updateIp = ? ' +
            'WHERE unionId = ?';
        db.doQuery(sql, [user.nickName, user.gender, user.city, user.province, user.country,
            user.avatarUrl, user.updateIp, user.unionId], callback);
    },
    updateGold(unionId, changeAmount, callback){
        let sql = 'UPDATE users SET gold = gold + ? ' +
            'WHERE unionId = ?';
        db.doQuery(sql, [changeAmount, unionId], callback);
    }
};

export default userDal;