import net from 'net.js'

const global = {};
global.net = net();

global.testUserInfo1 ={
    unionId: '10000',
    nickName: '张三',
    gender: 1,
    city: 'taiyuan',
    province: 'shanxi',
    country: 'china',
    avatarUrl: 'https://www.google.com',
    updateTime: '',
    updateIp: ''
};

global.testUserInfo2 ={
    unionId: '20000',
    nickName: '刘二',
    gender: 1,
    city: 'shijiazhuang',
    province: 'hebei',
    country: 'china',
    avatarUrl: 'https://www.google.com',
    updateTime: '',
    updateIp: ''
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
    updateTime: '',
    updateIp: ''
};

export default global;