/* 
 * 数据库访问模块
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const config = require('../config');
const mysql = require('mysql');
const Log = require('./log');
var log = new Log();

function Database() {
	var pool;// 连接池
	// 创建连接池
	this.createPool = function () {
		this.pool = mysql.createPool({
			host: config.database.host,
			user: config.database.user,
			port: config.database.port,
			password: config.database.password,
			supportBigNumbers: true,// 支持大数字
			connectionLimit: config.live_room.length,// 设置最大连接数量
			charset: config.database.utf8mb4 ? 'utf8mb4_general_ci' : 'utf8_general_ci'// 字符集
		});
	}

	// 创建连接
	this.createConn = function () {
		return new Promise((resolve, reject) => {
			this.pool.getConnection(function (err, conn) {
				if (err) {
					reject(err);
				}
				else {
					resolve(conn);
				}
			});
		});
	}

	// 同步查询
	this.query = function (conn, sql, values) {
		return new Promise((resolve, reject) => {
			conn.query(sql, values, (err, rows) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(rows);
				}
			});
		});
	}

	// 异步查询
	this.queryAsync = function (roomid, conn, sql, values) {
		conn.query(sql, values, (err, rows) => {
			if (err) {
				log.error(roomid, err);
			}
		});
	}
}

//导出模块
module.exports = Database;
