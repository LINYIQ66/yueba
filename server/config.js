// ============ 配置 ============
module.exports = {
  // 数据库
  DB: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Yueba2024!',
    database: 'yueba',
  },

  // 微信小程序 - 请替换成你自己的 AppSecret
  WX: {
    APPID: 'wx4afb3e5f7d1f4bab',
    APPSECRET: '32a7f81437e67a01b49fcb555491b5d0',
  },

  // JWT 密钥
  JWT_SECRET: 'yueba_jwt_secret_key_2024_!@#$',

  // 服务器端口
  PORT: 3000,

  // 上传文件路径
  UPLOAD_DIR: '/var/www/yueba/uploads',
};
