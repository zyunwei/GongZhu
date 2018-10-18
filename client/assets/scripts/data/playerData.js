let PlayerData = function () {
    let that = {};
    that.uid = undefined;
    that.uniqueID = '105564';
    that.nickName = '小明' + Math.floor(Math.random() * 10);

    for (let i = 0; i < 7; i++) {
        that.uniqueID += Math.floor(Math.random() * 10);
    }
    that.wxLoginSuccess = function (data) {
        that.uniqueID = data.uniqueID;
        that.nickName = data.nickName;
    }
    that.loginSuccess = function (data) {
        console.log("data=" + JSON.stringify(data));
    };
    return that;
}
export default PlayerData;