import net from './net'

const global = {};
global.net = net();
global.loginInfo = {};
global.lobbyNeedUpdate = 0;
global.notifyQueue = [];
global.roomNo = 0;

global.testUserInfo1 ={
    unionId: '20000',
    nickName: '刘二',
    gender: 1,
    city: 'shijiazhuang',
    province: 'hebei',
    country: 'china',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJiahgiafuMPYEN34QKf5dfZQYGAWexRE0W4ZcG7GI92Tb43bXLCnJDLz8vEzFyVSWBA4fYbNCakDJg/132',
};

global.testUserInfo2 ={
    unionId: '10000',
    nickName: '张三',
    gender: 1,
    city: 'taiyuan',
    province: 'shanxi',
    country: 'china',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJiahgiafuMPYEN34QKf5dfZQYGAWexRE0W4ZcG7GI92Tb43bXLCnJDLz8vEzFyVSWBA4fYbNCakDJg/132',
};

global.testUserInfo3 ={
    unionId: '30000',
    nickName: '李四',
    gender: 1,
    city: 'haidian',
    province: 'beijing',
    country: 'china',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJiahgiafuMPYEN34QKf5dfZQYGAWexRE0W4ZcG7GI92Tb43bXLCnJDLz8vEzFyVSWBA4fYbNCakDJg/132',
    updateTime: '',
    updateIp: ''
};

global.testUserInfo4 ={
    unionId: '40000',
    nickName: '王五',
    gender: 1,
    city: 'changde',
    province: 'hunan',
    country: 'china',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJiahgiafuMPYEN34QKf5dfZQYGAWexRE0W4ZcG7GI92Tb43bXLCnJDLz8vEzFyVSWBA4fYbNCakDJg/132',
};

global.testUserInfo5 ={
    unionId: '50000',
    nickName: '赵六',
    gender: 1,
    city: 'haikou',
    province: 'hainan',
    country: 'china',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJiahgiafuMPYEN34QKf5dfZQYGAWexRE0W4ZcG7GI92Tb43bXLCnJDLz8vEzFyVSWBA4fYbNCakDJg/132',
};


export default global;