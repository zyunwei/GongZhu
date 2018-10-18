const global = {};

const log4js = require("log4js");
log4js.configure({
    appenders: {x: {type: 'dateFile', filename: 'logs/', pattern: "yyyyMMdd.log", alwaysIncludePattern: true}},
    categories: {default: {appenders: ['x'], level: 'info'}}
});

global.logger = log4js.getLogger("x");
global.onlineUsers = [];
global.rooms = [];
global.serverStatus = 0; // 0 初始化 1 运行中 2 维护中

export default global;