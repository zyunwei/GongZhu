import global from "../global";

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
    }
};

export default gameManager;