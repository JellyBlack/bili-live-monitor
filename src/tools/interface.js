/* 
 * 统计工具
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

var config;
// 检查config.js是否有误
try {
	config = require('../../config');
}
catch (e) {
	// config.js有语法错误
	console.log("无法读取config.js！请检查括号是否成对，以及是否使用半角符号。");
	console.log(e);
	process.exit(0);
}

const Log = require('../log');
const Database = require('../database');
const fs = require('fs');
const readline = require('readline');
const combine = require('./combine');

var log = new Log();
var databases = [];
var database = new Database();
var conn;
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

async function main() {
	// 访问数据库
	log.v1(`正在获取数据库列表`);
	var existing_dbs = [];
	var json = [];
	try {
		database.createPool();
		conn = await database.createConn();
		var rows = await database.query(conn, "SHOW DATABASES;");
		rows.forEach(function (element) {
			existing_dbs.push(element.Database);
		});
	}
	catch (e) {
		log.v2(`数据库连接失败：${e}`);
		log.v2("请检查config.js关于数据库的配置。");
		process.exit(0);
	}
	log.v1(`正在读取历史记录文件`);
	var exists = await new Promise((resolve, reject) => {
		fs.exists("../../histroy/database_histroy.json", function (exists) {
			resolve(exists);
		});
	});
	if (exists) {
		try {
			json = JSON.parse(fs.readFileSync("../../histroy/database_histroy.json", "utf8"));
		}
		catch (e) {
			log.v2(`无法读取历史记录文件：${e}`);
		}
	}
	label: for (var i = 0; i < existing_dbs.length; i++) {
		var db = existing_dbs[i];
		// 跳过一些数据库
		if (db == "information_schema" || db == "performance_schema" || db == "sys" || db == "mysql") {
			continue label;
		}
		if (json.length != 0) {
			// 只读取历史记录里有的数据库
			for (var j = 0; j < json.length; j++) {
				if (json[j].database_name == db) {
					databases.push({
						database_name: db,
						display: `${db} - ${json[j].anchor_name}`
					});
					continue label;
				}
			}
		}
		else {
			databases.push({
				database_name: db,
				display: db
			});
		}
	}
	console.log("%%% 服务器的数据库列表 %%%");
	console.log("* 如未找到，尝试删除histroy/database_histroy.json文件");
	for (var i = 0; i < databases.length; i++) {
		console.log(`#${(i + 1)}	${databases[i].display}`);
	}
	var choice;
	while (true) {
		var answer = await question("请输入序号并回车，例如3\n");
		if (/^[0-9]+/.test(answer)) {
			var number = parseInt(answer);
			if (number <= 0 || number > databases.length) {
				console.log("序号不存在！");
			}
			else {
				choice = number - 1;
				break;
			}
		}
		else {
			console.log("无法识别你输入的序号！");
		}
	}
	console.log("%%% 统计工具 %%%\n"
		+ "#1	弹幕合并"
	);
	var tool;
	while (true) {
		var answer = await question("请输入序号并回车，例如3\n");
		if (/^[0-9]+/.test(answer)) {
			var number = parseInt(answer);
			if (number <= 0 || number > 1) {
				console.log("序号不存在！");
			}
			else {
				tool = number;
				break;
			}
		}
		else {
			console.log("无法识别你输入的序号！");
		}
	}
	if (tool == 1) {
		try {
			await database.query(conn, `USE ${databases[choice].database_name};`);
			log.v1("正在创建或确认数据表danmaku_combined");
			await database.query(conn, `CREATE TABLE IF NOT EXISTS danmaku_combined LIKE danmaku;`);
			log.v1("正在清空数据表danmaku_combined");
			await database.query(conn, `TRUNCATE TABLE danmaku_combined`);
			log.v1("正在复制弹幕数据");
			await database.query(conn, `INSERT INTO danmaku_combined SELECT * FROM danmaku`);
			log.v1("正在请求弹幕数据");
			var data = await database.query(conn, `SELECT id, text FROM danmaku_combined`);
			log.v1("pakku.js正在合并弹幕");
			var out_data = combine.parse(data, (msg) => {
				log.v1(msg);
			});
			log.v1("正在写入合并后的弹幕数据");
			// 创建临时表
			await database.query(conn, `CREATE TEMPORARY TABLE danmaku_tmp(id INT(11) PRIMARY KEY, text TEXT);`);
			var chunk = 1000;// 单次更新的数据量
			while (out_data.length != 0) {
				var danmakus = out_data.splice(0, chunk);
				await database.query(conn, `INSERT INTO danmaku_tmp (id, text) VALUES ? ;`, [danmakus]);
			}
			await database.query(conn, `UPDATE danmaku_combined, danmaku_tmp SET danmaku_combined.text=danmaku_tmp.text WHERE danmaku_combined.id=danmaku_tmp.id`);
			log.v1("合并完成");
		}
		catch (e) {
			console.log(e);
		}
		finally {
			conn.release();
			process.exit(0);
		}
	}
}

// 入口
main();

function question(text) {
	return new Promise((resolve, reject) => {
		rl.question(text, (answer) => {
			resolve(answer);
		});
	});
}
