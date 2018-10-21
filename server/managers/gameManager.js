import global from "../global";
import userManager from "./userManager";

const gameManager = {
    createRoom(roomType) {
        let roomNo = 1;
        for (roomNo = 1; roomNo < 100000; roomNo++) {
            let isOk = true;
            for (let i = 0; i < global.rooms.length; i++) {
                if (global.rooms[i].no == roomNo) {
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
            status: 0
        };

        global.rooms.push(roomInfo);
        return roomInfo;
    },
    joinRoom(unionId, roomNo) {
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no == roomNo) {
                // 如果存在相同ID，表示断线重连
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId == unionId) {
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
                        unionId : userInfo.unionId,
                        nickName : userInfo.nickName,
                        money : userInfo.money,
                        status : 0,
                        isOnline : 1
                    });
                return true;
            }
        }
        return false;
    },
    exitRoom(unionId, roomNo) {
        let isOk = false;
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no == roomNo) {
                let slotIndex = -1;
                for (let j = 0; j < global.rooms[i].players.length; j++) {
                    if (global.rooms[i].players[j].unionId == unionId) {
                        isOk = true;
                        slotIndex = j;
                        break;
                    }
                }
                if (isOk) {
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
            if (global.rooms[i].no == roomNo) {
                if (global.rooms[i].players.length <= 0) {
                    global.rooms.splice(i, 1);
                }
                break;
            }
        }
    },
    getCardInfo(unionId, roomNo){
        for (let i = 0; i < global.rooms.length; i++) {
            if (global.rooms[i].no == roomNo) {
                for(let j = 0; j < global.rooms[i].players.length; j++){
                    if(global.rooms[i].players[j].unionId == unionId){
                        return global.rooms[i].players[j].cards;
                    }
                }
            }
        }
    }
};

export default gameManager;