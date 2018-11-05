import db from './db';

const commonDal = {
    insertGameResult(gameResult, callback) {
        let sql = 'INSERT INTO gameresults (id, gameId, roomNo, roundNo, position, unionId, nickName, score, goldChange, pointCards, exposeCards, startTime, endTime) ' +
            'VALUES (uuid(),?,?,?,?,?,?,?,?,?,?,?,?);';
        db.doQuery(sql, [gameResult.gameId, gameResult.roomNo, gameResult.roundNo, gameResult.position, gameResult.unionId, gameResult.nickName, gameResult.score,
            gameResult.goldChange, gameResult.pointCards, gameResult.exposeCards, gameResult.startTime, gameResult.endTime], callback);
    },
    insertGoldChange(goldChange, callback) {
        let sql = 'INSERT INTO goldchange (id, unionId, goldBefore, changeAmount, goldAfter, changeType, relNo, remark, actionUser, actionTime) ' +
            'VALUES (uuid(),?,?,?,?,?,?,?,?,NOW());';
        db.doQuery(sql, [goldChange.unionId, goldChange.goldBefore, goldChange.changeAmount, goldChange.goldAfter, goldChange.changeType, goldChange.relNo,
            goldChange.remark, goldChange.actionUser], callback);
    },
};

export default commonDal;