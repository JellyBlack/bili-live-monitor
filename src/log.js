/* 
 * 打印日志模块
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const config = require('../config');
const fs = require('fs');

const level = config.log.log_level;// 日志等级

function Log() {
	// 0级
	this.v0 = function (msg) {
		if (config.log.enable_log && level <= 0) {
			console.log(msg);
		}
	}

	// 1级
	this.v1 = function (msg) {
		if (config.log.enable_log && level <= 1) {
			console.log(msg);
		}
	}

	// 2级
	this.v2 = function (msg) {
		if (config.log.enable_log && level <= 2) {
			console.log(msg);
		}
	}

	//创建logs目录
	this.init = function () {
		if (!config.log.enable_log) {
			return;
		}
		try {
			fs.mkdirSync("logs");
		}
		catch (e) {
			// 已存在logs目录
		}
	}

	// 打印普通日志
	this.verbose = function (roomid, msg) {
		if (config.log.enable_log && level < 2) {
			fs.appendFile(`logs/${roomid}_verbose.log`, msg + '\n', function () { });
		}
	}

	// 打印错误日志
	this.error = function (roomid, msg) {
		if (config.log.enable_log) {
			console.log(msg);
			fs.appendFile(`logs/${roomid}_error.log`, msg + '\n', function () { });
		}
	}
}

// 导出模块
module.exports = Log;
