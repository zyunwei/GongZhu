import net from 'net.js'

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
    avatarUrl: 'https://www.google.com',
};

global.testUserInfo2 ={
    unionId: '10000',
    nickName: '张三',
    gender: 1,
    city: 'taiyuan',
    province: 'shanxi',
    country: 'china',
    avatarUrl: 'https://www.google.com',
};

global.testUserInfo3 ={
    unionId: '30000',
    nickName: '李四',
    gender: 1,
    city: 'haidian',
    province: 'beijing',
    country: 'china',
    avatarUrl: 'https://www.google.com',
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
    avatarUrl: 'https://www.google.com',
};

global.testUserInfo5 ={
    unionId: '50000',
    nickName: '赵六',
    gender: 1,
    city: 'haikou',
    province: 'hainan',
    country: 'china',
    avatarUrl: 'https://www.google.com',
};


export default global;