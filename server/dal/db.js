import mysql from 'mysql';

const pool = mysql.createPool({
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "Password01!",
    "database": "gongzhu"
});

const db = {};
db.con = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            callback(null, connection);
            connection.release();
        }
    });
};

db.doQuery = function (sql, params, callback) {
    this.con(function (err, connection) {
        if (err) {
            if (callback) {
                callback(err);
            }
            else {
                console.log(err);
            }
            return;
        }
        connection.query(sql, params,
            function (err, result) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }
                    else {
                        console.log(err);
                    }
                    return;
                }
                if (callback) callback(null, result);
            })
    });
}

export default db;