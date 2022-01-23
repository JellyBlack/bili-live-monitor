/* 
 * 主文件
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

var config;
// 检查config.js是否有误
try {
	config = require('../config');
}
catch (e) {
	// config.js有语法错误
	console.log("无法读取config.js！请检查括号是否成对，以及是否使用半角符号。");
	console.log(e);
	process.exit(0);
}

const fs = require('fs');
const net = require('net');
const Log = require('./log');
const Database = require('./database');
const Connection = require('./connection');
const LiveroomHandler = require('./liveroom_handler');
const notification = require('./notification');
const queries = require('./queries');

// 监控直播间的id列表
var rooms = [];

// 直播间对象
var Room = function () {
	var roomid;// 房间号
	var anchor_mid;// 主播mid
	var anchor_name;// 主播用户名
	var database_name;// 数据库名称
	var conn;// 数据库连接
	var running;// 是否运行
}

var log = new Log();
var database;
var liveroomHandler = new LiveroomHandler();
var conns = [];// 直播间连接列表
var all_ready = false;// 是否准备就绪，用于控制台连接

async function main() {
	// 获取版本
	var version;
	try {
		var pkg = fs.readFileSync("package.json");
		version = JSON.parse(pkg).version;
	}
	catch (e) {
		log.v2("无法获取版本信息！");
		process.exit(0);
	}
	// 打印版本信息
	log.v2(`bili-live-monitor v${version}`);
	log.v2("Copyright (C) 2021 Jelly Black");
	log.v2("本项目使用GPLv3协议在GitHub开源，许可详情请访问https://gnu.org/licenses/gpl-3.0.html");
	log.v2("项目开源地址：https://github.com/JellyBlack/bili-live-monitor");
	log.init();// 初始化日志服务
	// 开启本地TCP服务器，用于与控制台通信

	var server = net.createServer(function (socket) {
		log.v2("控制台已连接");
		// 打印版本信息
		socket.write(`bili-live-monitor v${version}\n`);
		socket.write(getState());
		socket.write("输入房间号并回车可切换状态，输入y并回车可安全结束监控，输入q退出控制台，直接回车刷新状态");

		if (!all_ready) {
			socket.write("监控未准备就绪，请稍候尝试连接\n");
			socket.write("/disconnect");
		}

		socket.on('data', async function (data) {
			var cmd = data.toString().toLowerCase();
			// 刷新
			if (new RegExp("^/refresh$").test(cmd)) {
				socket.write(getState());
			}

			// 切换状态
			else if (new RegExp("^[0-9]+$").test(cmd)) {
				for (var i = 0; i < conns.length; i++) {
					if (conns[i].roomid == cmd) {
						conns[i].running = !conns[i].running;
						conns[i].auto_stopped = false;
						socket.write(getState());
						return;
					}
				}
				socket.write("未找到指定直播间\n");
			}

			// 安全退出
			else if (new RegExp("^y$").test(cmd)) {
				socket.write("正在安全退出");
				log.v2("正在安全退出");
				// 将状态设为暂停，避免新数据进入缓冲区
				for (var i = 0; i < conns.length; i++) {
					conns[i].running = false;
				}
				conns[0].finish();// 立即插值
				setTimeout(async function () {
					for (var i = 0; i < conns.length; i++) {
						conns[i].live_conn.close();// 关闭直播间连接
						if (config.database.enable_database) {
							try {
								await conns[i].database_conn.release();// 关闭数据库连接
							}
							catch (e) {
								log.v2(e);
							}
						}
						log.v0(`已安全关闭直播间${conns[i].roomid}的连接`);
					}
					log.v2("已安全退出监控");
					notification.notifyViaDingTalk("已安全退出监控。");
					socket.write("已安全退出监控\n");
					socket.write("/disconnect");// 请求客户端断开连接
					setTimeout(() => { process.exit(0); }, 1000);
				}, 1000);
			}

			else {
				socket.write("未知命令\n");
			}
		});

		socket.on('end', function () {
			log.v2("控制台断开连接");
		});
		socket.on('error', function () {
			log.v2("控制台断开连接");
		});
	});

	try {
		server.listen(config.extra.console_port, function () {
			log.v0(`在${config.extra.console_port}端口上侦听控制台连接`);
		});
	}
	catch (e) {
		log.v2("无法侦听控制台！请检查端口号是否合法，并注意不可多实例运行。" + e);
		process.exit(0);
	}

	// 桥头麻袋，让“侦听控制台连接”的日志先打印
	await new Promise((resolve, reject) => {
		setTimeout(resolve(), 1);
	});

	// 检查要监控的直播间
	log.v1("正在检查待监控的直播间");
	if (config.live_room.length == 0) {
		log.v2("没有配置任何直播间，已终止运行。请检查config.js文件。");
		process.exit(0);
	}

	for (var i = 0; i < config.live_room.length; i++) {
		var currentRoom = i + 1; //当前检查的房间
		var element = config.live_room[i];
		log.v0(`正在检查第${currentRoom}个直播间配置`);
		if (element <= 0) {
			log.v0(`第${currentRoom}个直播间未配置，已跳过\n`);
			return;
		}
		try {
			var trueId;
			var mid;
			var anchor_name;
			var running;
			if (config.extra.room_check) {
				// 测试直播间可用性
				liveroomHandler.testRoomAvailability(element);
				log.v0(`第${currentRoom}个直播间检查通过`);
				await sleep();// 请求间隔
				// 获取真实id和状态
				var root = liveroomHandler.getTrueIdAndStatus(element);
				trueId = root.trueId;
				var status = root.status;
				var status_str;
				if (status == 1) {
					status_str = "直播中";
					running = true;
				}
				else if (status == 2) {
					status_str = "轮播中";
					running = false;
				}
				else {
					status_str = "未开播";
					running = false;
				}
				log.v0(`第${currentRoom}个直播间的真实id为${trueId}`);
				await sleep();
				// 获取主播信息
				mid = liveroomHandler.getMid(trueId);
				var data = liveroomHandler.getAnchorInfo(mid);
				anchor_name = data.info.uname;
				log.v0(`直播间#${currentRoom}    主播：${data.info.uname}（mid:${mid}）    ${data.info.official_verify.num == -1 ? '' : '√认证主播    '}等级：${data.exp.master_level.level}    状态：${status_str}`);
				log.v0(`粉丝勋章：${data.medal_name}    粉丝数：${data.follower_num}    公告：${data.room_news.content}`);
				await sleep();
			}
			else {
				// 未启用直播校验
				trueId = element;
				mid = 0;
				anchor_name = "未知";
				running = true;
				log.v0("已跳过房间校验");
			}
			// 构造Room对象
			var room = new Room();
			room.roomid = trueId;
			room.anchor_mid = mid;
			room.anchor_name = anchor_name;
			room.running = running;
			// 检查是否重复
			var flag = false;
			rooms.forEach(function (element) {
				if (element.roomid == trueId) {
					if (!flag) {
						log.v0('该直播间与先前配置的直播间重复\n');
					}
					flag = true;
				}
			});
			// 将直播间添加到数组
			if (!flag) {
				rooms.push(room);
				log.v0('');
			}
		}
		catch (e) {
			log.v2(`第${currentRoom}个直播间出错：${e}\n`);
			process.exit(0);
		}
	}
	// 没有任何直播间，则退出
	if (rooms.length == 0) {
		log.v2("没有配置任何直播间，已终止运行。请检查config.js文件。");
		process.exit(0);
	}
	log.v1(`成功配置了${rooms.length}个直播间\n`);

	if (config.database.enable_database) {
		// 检查数据库名称是否重复
		var pattern = /%(roomid|mid|date|time|random)%/;
		if (config.database.database_name != "") {
			if (rooms.length > 1 && !pattern.test(config.database.database_name)) {
				log.v2("您为多个直播间指定了相同的数据库，程序已终止运行。");
				process.exit(0);
			}
		}
		var date_str = getDateStr();
		var time_str = getTimeStr();
		rooms.forEach(function (element) {
			// 替换待填充字段
			var name = config.database.database_name;
			if (name == "") {
				name = "live_%roomid%_stats";
			}
			name = name.replace(/%roomid%/g, element.roomid);
			name = name.replace(/%mid%/g, element.mid);
			name = name.replace(/%date%/g, date_str);
			name = name.replace(/%time%/g, time_str);
			while (/%random%/.test(name)) {
				name = name.replace("%random%", rnd());
			}
			element.database_name = name;
		});
		// 检查数据库名称是否重复
		for (var i = 0; i < rooms.length; i++) {
			for (var j = 0; j < i; j++) {
				if (rooms[i].database_name == rooms[j].database_name) {
					log.v2("您为多个直播间指定了相同的数据库，程序已终止运行。");
					process.exit(0);
				}
			}
		}
		// 服务器已有的数据库列表
		var existing_dbs = [];
		// 连接数据库
		log.v1(`正在测试数据库连接`);
		log.v0(`数据库地址：${config.database.host}`);
		log.v0(`端口：${config.database.port}`);
		log.v0(`用户名：${config.database.user}`);
		log.v0("密码：***");
		database = new Database();
		var conn;
		try {
			database.createPool();
			conn = await database.createConn();
			var rows = await database.query(conn, "SHOW DATABASES;");
			rows.forEach(function (element) {
				existing_dbs.push(element.Database);
			});
			log.v0(`服务器的数据库列表：${existing_dbs}`);
			conn.release();
		}
		catch (e) {
			log.v2(`数据库连接失败：${e}`);
			log.v2("请检查config.js关于数据库的配置。");
			process.exit(0);
		}
		if (config.database.enable_database) {
			log.v1("数据库连接成功");
		}

		// 对每个直播间的数据库进行初始化
		for (var i = 0; i < rooms.length; i++) {
			try {
				log.v0(`直播间${rooms[i].roomid}：正在建立数据库连接`);
				rooms[i].conn = await database.createConn();
				log.v0(`直播间${rooms[i].roomid}：目标数据库为${rooms[i].database_name}`);
				var need_to_create = true;// 是否要新建数据库
				// 检查是否已存在
				for (var j = 0; j < existing_dbs.length; j++) {
					if (existing_dbs[j] == rooms[i].database_name) {
						log.v0(`直播间${rooms[i].roomid}：目标数据库已存在`);
						if (config.database.what_to_do_when_existing.toUpperCase() == "NOTHING") {
							// 报错
							log.v2(`直播间${rooms[i].roomid}对应的数据库（${rooms[i].database_name}）已存在，根据您的要求，已终止运行`);
							finishConns();
							process.exit(0);
						}
						else if (config.database.what_to_do_when_existing.toUpperCase() == "RECREATE") {
							// 删库跑路
							await database.query(rooms[i].conn, `DROP DATABASE ${rooms[i].database_name};`);
							log.v1(`直播间${rooms[i].roomid}：已删除原数据库`);
						}
						else if (config.database.what_to_do_when_existing.toUpperCase() == "NEW") {
							// 追加随机字符
							var string = '';
							for (var k = 0; k < 8; k++) {
								string += rnd();
							}
							rooms[i].database_name += string;
							log.v1(`直播间${rooms[i].roomid}：已追加随机字符，新名称为${rooms[i].database_name}`);
						}
						else if (config.database.what_to_do_when_existing.toUpperCase() == "APPEND") {
							// 调整结构
							need_to_create = false;
						}
						else {
							log.v2(`无法识别您的处理方案“${config.database.what_to_do_when_existing}”！请检查config.js`);
							finishConns();
							process.exit(0);
						}
					}
				}
				if (need_to_create) {
					// 新建数据库
					await database.query(rooms[i].conn, `CREATE DATABASE ${rooms[i].database_name};`);
					log.v0(`直播间${rooms[i].roomid}：已新建数据库`);
				}
				// 进入数据库
				await database.query(rooms[i].conn, `USE ${rooms[i].database_name};`);
				log.v0(`直播间${rooms[i].roomid}：已进入数据库`);
				// 创建数据表
				await database.query(rooms[i].conn, queries.fans_medal);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表fans_medal`);
				await database.query(rooms[i].conn, queries.users_from_danmaku);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_danmaku`);
				await database.query(rooms[i].conn, queries.users_from_gifts);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_gifts`);
				await database.query(rooms[i].conn, queries.users_from_welcome);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_welcome`);
				await database.query(rooms[i].conn, queries.gifts);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表gifts`);
				await database.query(rooms[i].conn, queries.welcome_msg);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表welcome_msg`);
				await database.query(rooms[i].conn, queries.danmaku);
				log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表danmaku`);
				if (config.data.popularity) {
					await database.query(rooms[i].conn, queries.popularity);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表popularity`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，popularity未创建`);
				}
				if (config.data.followers) {
					if (!config.extra.room_check) {
						throw "禁用房间校验时，不能启用粉丝数监控";
					}
					await database.query(rooms[i].conn, queries.followers);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表followers`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，followers未创建`);
				}
				if (config.data.new_guards) {
					await database.query(rooms[i].conn, queries.new_guards);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表new_guards`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，new_guards未创建`);
				}
				if (config.data.entry_effect) {
					await database.query(rooms[i].conn, queries.entry_effect);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表entry_effect`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，entry_effect未创建`);
				}
				if (config.data.superchat) {
					await database.query(rooms[i].conn, queries.superchat);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表superchat`);
					await database.query(rooms[i].conn, queries.users_from_superchat);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表users_from_superchat`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，superchat未创建`);
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，users_from_superchat未创建`);
				}
				if (config.data.json) {
					await database.query(rooms[i].conn, queries.json);
					log.v0(`直播间${rooms[i].roomid}：已新建或确认数据表json`);
				}
				else {
					log.v0(`直播间${rooms[i].roomid}：根据您的要求，json未创建`);
				}
				log.v0(`直播间${rooms[i].roomid}：数据表创建或确认完毕`);
				// 为fans_medal表添加一条缺省记录
				await database.query(rooms[i].conn, "INSERT IGNORE INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES (0, '无勋章或主播无效', 'NO MEDAL OR INVALID ANCHOR')");
				log.v1(`直播间${rooms[i].roomid}：数据库初始化完毕`);
			}
			catch (e) {
				log.v2(`初始化直播间${rooms[i].roomid}的数据库时出错：${e}`);
				log.v2("已终止运行");
				finishConns();
				process.exit(0);
			}
		}
	}
	else {
		log.v1(`已禁用数据库`);
	}

	// 建立直播连接
	log.v0(`您指定的连接协议为${config.connection.protocol}`);
	log.v0(`您已${config.connection.doKeep ? "开启" : "关闭"}断线重连功能`);
	for (var i = 0; i < rooms.length; i++) {
		var live_conn = new Connection();
		// 是否立即开始监控
		var running = true;
		if (config.extra.live_only && !rooms[i].running) {
			running = false;
		}
		await live_conn.create(rooms[i].roomid, rooms[i].anchor_mid, database, rooms[i].conn, running);
		live_conn.init();
		conns.push(live_conn);
	}

	if (config.database.enable_database) {
		// 添加历史记录
		try {
			fs.mkdirSync("histroy");
		}
		catch (e) {
			// 已存在histroy目录
		}
		var json;
		var exists = await new Promise((resolve, reject) => {
			fs.exists("histroy/database_histroy.json", function (exists) {
				resolve(exists);
			});
		});
		if (exists) {
			try {
				json = JSON.parse(fs.readFileSync("histroy/database_histroy.json", "utf8"));
			}
			catch (e) {
				log.v2(`无法读取历史记录文件：${e}`);
				json = [];
			}
		}
		else {
			json = [];
		}
		label: for (var i = 0; i < rooms.length; i++) {
			for (var j = 0; j < json.length; j++) {
				if (json[j].database_name == rooms[i].database_name) {
					json[j].roomid = rooms[i].roomid;
					json[j].anchor_name = rooms[i].anchor_name;
					json[j].anchor_mid = rooms[i].anchor_mid;
					continue label;
				}
			}
			json.push({
				database_name: rooms[i].database_name,
				roomid: rooms[i].roomid,
				anchor_name: rooms[i].anchor_name,
				anchor_mid: rooms[i].anchor_mid
			});
		}
		try {
			fs.writeFileSync("histroy/database_histroy.json", JSON.stringify(json));
		}
		catch (e) {
			log.v2(`无法写入历史记录文件：${e}`);
		}
	}

	// 此处已全部准备完毕
	all_ready = true;
	notification.notifyViaDingTalk("所有监控已设立完毕。");
	if (config.dingtalk.enabled) {
		if (config.dingtalk.interval >= 1) {
			setInterval(autoNotifyViaDingTalk, config.dingtalk.interval * 60000);
		}
		else {
			log.v2("\n钉钉通知过于频繁，已禁用钉钉通知。");
		}
	}
	if (config.email.enabled) {
		if (config.email.interval >= 5) {
			setInterval(autoNotifyViaEmail, config.email.interval * 60000);
		}
		else {
			log.v2("\n邮件通知过于频繁，已禁用邮件通知。");
		}
	}
	log.v2("\n所有监控已设立完毕。");
	log.v2("请使用“npm run console”安全退出，避免数据丢失");
}

// 入口
main();

// 生成随机数字
function rnd() {
	return Math.floor(Math.random() * 10);
}

// 获取直播间状态
function getState() {
	var string = "直播间监控列表\n";
	for (var i = 0; i < conns.length; i++) {
		var status;
		if (conns[i].auto_stopped) {
			status = "已自动停止";
		}
		else if (conns[i].running) {
			status = "运行中";
		}
		else {
			status = "已暂停";
		}
		string += `直播间#${i + 1}  ${rooms[i].anchor_name}  房间号：${conns[i].roomid}  状态：${status}  事件数：${conns[i].recorded_events}\n`;
	}
	return string;
}

// 钉钉定时通知
var last_recorded_events = [];
function autoNotifyViaDingTalk() {
	var string = "过去";
	if (config.dingtalk.interval >= 60) {
		var hour = Math.floor(config.dingtalk.interval / 60);
		string += `${hour}小时`;
	}
	var minute = config.dingtalk.interval % 60;
	if (minute != 0) {
		string += `${minute}分钟`;
	}
	string += "的监控数据\n";

	for (var i = 0; i < conns.length; i++) {
		var events;
		if (last_recorded_events.length == i) {
			last_recorded_events.push(conns[i].recorded_events);
			events = conns[i].recorded_events;
		}
		else {
			events = conns[i].recorded_events - last_recorded_events[i];
		}
		var status;
		if (conns[i].auto_stopped) {
			status = "已自动停止";
		}
		else if (conns[i].running) {
			status = "运行中";
		}
		else {
			status = "已暂停";
		}
		string += `直播间#${i + 1}  ${rooms[i].anchor_name}  房间号：${conns[i].roomid}  状态：${status}  事件数：${events}${i == conns.length - 1 ? "" : "\n"}`;
	}
	notification.notifyViaDingTalk(string);
}

// 邮件自动通知
function autoNotifyViaEmail() {
	// HTML代码
	var html = '<style type="text/css">@charset"utf-8";.tabtop13{margin-top:13px}.tabtop13 td{background-color:#ffffff;height:25px;line-height:150%}.font-center{text-align:center}.btbg{background:#e9faff!important}.btbg1{background:#f2fbfe!important}.btbg2{background:#f3f3f3!important}.biaoti{font-family:微软雅黑;font-size:26px;font-weight:bold;border-bottom:1px dashed#CCCCCC;color:#255e95}.titfont{font-family:微软雅黑;font-size:16px;font-weight:bold;color:#255e95;background-color:#e9faff}</style><table width="100%"border="0"cellspacing="0"cellpadding="0"align="center"><tr><td align="center"class="biaoti"height="60">bili-live-monitor&nbsp;实时监控数据</td></tr><tr><td align="right"height="25">';
	var time_now = Date.now();
	var time_before = new Date(time_now - config.email.interval * 60000).getTime();
	var date1 = formatDateStr(time_before);
	var date2 = formatDateStr(time_now);
	var time1 = formatTimeStr(time_before);
	var time2 = formatTimeStr(time_now);
	var time_str;
	if (date1 == date2) {
		time_str = `统计时间：${date1}&nbsp;${time1}~${time2}`;
	}
	else {
		time_str = `统计时间：${date1}&nbsp;${time1}~${date2}&nbsp;${time2}`;
	}
	html += time_str;
	html += '</td></tr></table><table width="100%"border="0"cellspacing="1"cellpadding="4"bgcolor="#cccccc"class="tabtop13"align="center"><tr><td class="btbg font-center titfont">房间号</td><td class="btbg font-center titfont">主播名</td><td class="btbg font-center titfont">状态</td><td class="btbg font-center titfont">弹幕数</td><td class="btbg font-center titfont">入场数</td><td class="btbg font-center titfont">礼物数</td><td class="btbg font-center titfont">事件数</td></tr>';
	var total_danmaku = 0;
	var total_welcome = 0;
	var total_gifts = 0;
	var total_events = 0;
	for (var i = 0; i < conns.length; i++) {
		var line = '<tr>';
		line += `<td class="btbg1 font-center">${conns[i].roomid}</td>`;
		line += `<td class="btbg2 font-center">${rooms[i].anchor_name}</td>`;
		var status;
		if (conns[i].auto_stopped) {
			status = "已自动停止";
		}
		else if (conns[i].running) {
			status = "运行中";
		}
		else {
			status = "已暂停";
		}
		line += `<td class="font-center">${status}</td>`;
		line += `<td class="font-center">${conns[i].statistics_email.danmaku}</td>`;
		total_danmaku += conns[i].statistics_email.danmaku;
		conns[i].statistics_email.danmaku = 0;
		line += `<td class="font-center">${conns[i].statistics_email.welcome_msg}</td>`;
		total_welcome += conns[i].statistics_email.welcome_msg;
		conns[i].statistics_email.welcome_msg = 0;
		line += `<td class="font-center">${conns[i].statistics_email.gifts}</td>`;
		total_gifts += conns[i].statistics_email.gifts;
		conns[i].statistics_email.gifts = 0;
		line += `<td class="font-center">${conns[i].statistics_email.json}</td>`;
		total_events += conns[i].statistics_email.json;
		conns[i].statistics_email.json = 0;
		line += '</tr>';
		html += line;
	}
	html += `<tr><td class="btbg1 font-center">总计</td><td class="btbg2 font-center"></td><td class="font-center"></td><td class="font-center">${total_danmaku}</td><td class="font-center">${total_welcome}</td><td class="font-center">${total_gifts}</td><td class="font-center">${total_events}</td></tr></table>`;
	notification.notifyViaEmail("bili-live-monitor 实时监控数据", html);
}


// 销毁已有的连接
function finishConns() {
	rooms.forEach(function (ele) {
		try {
			ele.conn.release();
		}
		catch (e) { }
	});
}

// 获取日期
function getDateStr() {
	var date = new Date();
	var YY = date.getFullYear();
	var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
	var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
	return '' + YY + MM + DD;
}

// 获取时间
function getTimeStr() {
	var date = new Date();
	var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
	var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
	return '' + hh + mm + ss;
}
// 获取标准格式日期
function formatDateStr(date) {
	var date = new Date(date);
	var YY = date.getFullYear();
	var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
	var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
	return YY + '-' + MM + '-' + DD;
}

// 获取标准格式时间
function formatTimeStr(date) {
	var date = new Date(date);
	var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
	var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
	return hh + ':' + mm + ':' + ss;
}

// 请求间隔（同步）
function sleep() {
	var min_time = config.extra.interval_base - config.extra.interval_random;
	if (min_time < 0) {
		min_time = 0;
	}
	var max_time = config.extra.interval_base + config.extra.interval_random;
	var time = min_time + Math.floor(Math.random() * (max_time - min_time));
	return new Promise((resolve, reject) => {
		setTimeout(function () {
			resolve();
		}, time);
	});
}

// 导出模块
module.exports = main;
