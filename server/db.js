const mysql = require('mysql2/promise');
const config = require('./config');

// 连接池
const pool = mysql.createPool({
  host: config.DB.host,
  port: config.DB.port,
  user: config.DB.user,
  password: config.DB.password,
  database: config.DB.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

module.exports = pool;
