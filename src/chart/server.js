/* 
 * HTTP服务器
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

const http = require('http');
const url = require('url');
const Log = require('../log');
const Database = require('../database');
const fs = require('fs');
const opn = require('opn');

var log = new Log();
var databases = [];
var database = new Database();
var conn;

async function main() {
	// 访问数据库
	log.v1(`正在获取数据库列表`);
	var existing_dbs = [];// 已有的数据库列表
	var json = [];
	try {
		database.createPool();
		conn = await database.createConn();
		var rows = await database.query(conn, "SHOW DATABASES;");
		rows.forEach(function (element) {
			existing_dbs.push(element.Database);
		});
		log.v1(`服务器的数据库列表：${existing_dbs}`);
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

	// 配置服务器
	var host = "localhost";
	if (config.server.host != "") {
		host = config.server.host;
	}
	try {
		server.listen(config.server.port, host, function () {
			log.v2(`服务器正在${config.server.port}端口上侦听`);
			opn(`http://localhost:${config.server.port}`);
		});
	}
	catch (e) {
		log.v2(`无法侦听端口${config.server.port}！请检查端口是否被占用：${e}`);
		conn.release();
		process.exit(0);
	}
}

// 入口
main();

// HTTP服务器
const server = http.createServer(async function (req, res) {
	var obj = url.parse(req.url, true);
	var pathname = obj.pathname;
	var query = obj.query;// 请求参数
	if (pathname == "/") {
		res.setHeader("Content-Type", "text/html");
		res.end(fs.readFileSync("src/chart/chart.html"));
	}
	else if (pathname == "/favicon.ico") {
		res.setHeader("Content-Type", "image/x-icon");
		res.end(fs.readFileSync("assets/favicon.ico"));
	}
	else if (pathname == "/chart.js") {
		res.setHeader("Content-Type", "text/javascript");
		res.end(fs.readFileSync("src/chart/chart.js"));
	}
	else if (pathname == "/csv.min.js") {
		res.setHeader("Content-Type", "text/javascript");
		res.end(fs.readFileSync("src/chart/csv.js/csv.min.js"));
	}
	else if (pathname == "/getDatabases") {
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(databases));
	}
	else if (pathname == "/getData") {
		var error = JSON.stringify({
			code: -1,
			msg: "请求不合法"
		});
		if (query.database != null && query.chart != null) {
			if (/^[0-9]+$/.test(query.database)) {
				if (/^[A-Za-z0-9_]+$/.test(query.chart)) {
					// 通过防SQL注入校验
					try {
						await database.query(conn, `use ${databases[query.database].database_name}`);
						var data;
						if (query.chart == "gifts") {
							data = await database.query(conn, `SELECT num, UNIX_TIMESTAMP(time) * 1000 time FROM gifts order by time;`);
						}
						else if (query.chart == "welcome") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM welcome_msg order by time;`);
						}
						else if (query.chart == "popularity") {
							data = await database.query(conn, `SELECT popularity num, UNIX_TIMESTAMP(time) * 1000 time FROM popularity order by time;`);
						}
						else if (query.chart == "followers") {
							data = await database.query(conn, `SELECT followers num, UNIX_TIMESTAMP(time) * 1000 time FROM followers order by time;`);
						}
						else if (query.chart == "superchat") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM superchat order by time;`);
						}
						else if (query.chart == "new_guards") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM new_guards order by time;`);
						}
						else if (query.chart == "events") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM json order by time;`);
						}
						else if (query.chart == "entry_effect") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM entry_effect order by time;`);
						}
						else if (query.chart == "danmaku_sum") {
							data = await database.query(conn, `SELECT 1 num, UNIX_TIMESTAMP(time) * 1000 time FROM danmaku order by time;`);
						}
						else if (query.chart == "danmaku_rank") {
							danmaku = await database.query(conn, `SELECT text, UNIX_TIMESTAMP(time) * 1000 time FROM danmaku${query.combined == "true" ? "_combined" : ""} order by time;`);
							rank = await database.query(conn, `SELECT text FROM danmaku${query.combined == "true" ? "_combined" : ""} group by text order by COUNT(*) DESC LIMIT 50;`);
							data = {
								danmaku: danmaku,
								rank: rank
							}
						}
						else if (query.chart == "danmaku_dynamic_rank") {
							data = await database.query(conn, `SELECT text, UNIX_TIMESTAMP(time) * 1000 time FROM danmaku${query.combined == "true" ? "_combined" : ""} order by time;`);
						}
						else if (query.chart == "medal") {
							data = await database.query(conn, `SELECT b.medal_name, b.anchor_name, COUNT(*) num FROM users_from_${query.source} a INNER JOIN fans_medal b ON a.medal=b.anchor_room_id GROUP BY a.medal ORDER BY COUNT(*) DESC LIMIT 50;`);
						}
						else if (query.chart == "medal_level") {
							data = await database.query(conn, `SELECT medal_level level, COUNT(*) num FROM users_from_${query.source} GROUP BY medal_level ORDER BY COUNT(*) DESC;`);
						}
						else if (query.chart == "level") {
							data = await database.query(conn, `SELECT level, COUNT(*) num FROM users_from_${query.source} GROUP BY level ORDER BY COUNT(*) DESC;`);
						}
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({
							code: 0,
							msg: "",
							data: data
						}));
					}
					catch (e) {
						log.v2(e);
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({
							code: -2,
							msg: e,
						}));
					}
				}
				else {
					res.setHeader("Content-Type", "application/json");
					res.end(error);
				}
			}
			else {
				res.setHeader("Content-Type", "application/json");
				res.end(error);
			}
		}
		else {
			res.setHeader("Content-Type", "application/json");
			res.end(error);
		}
	}
	else {
		res.setHeader("Content-Type", "text/plain");
		res.setStatusCode = 404;
		res.end("404 Not Found.");
	}
});
