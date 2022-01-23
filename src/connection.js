/* 
 * 直播间连接
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const config = require('../config');
const { LiveWS, LiveTCP, KeepLiveWS, KeepLiveTCP } = require('bilibili-live-ws');
const Database = require('./database');
const Log = require('./log');
const LiveroomHandler = require('./liveroom_handler');
const notification = require('./notification');

var liveroomHandler = new LiveroomHandler();
var log = new Log();
var conns = [];// 连接列表
var ready = false;// 是否完成setInterval等操作

// 将此赋值给last_query，立即插值
var query_right_now = {
	fans_medal: config.database.sql_interval * 1001,
	danmaku: config.database.sql_interval * 1001,
	welcome_msg: config.database.sql_interval * 1001,
	gifts: config.database.sql_interval * 1001,
	popularity: config.database.sql_interval * 1001,
	json: config.database.sql_interval * 1001,
	followers: config.database.sql_interval * 1001,
	new_guards: config.database.sql_interval * 1001,
	entry_effect: config.database.sql_interval * 1001,
	superchat: config.database.sql_interval * 1001
};

function Connection() {
	this.create = function (roomid, anchor_mid, database, database_conn, running/* 初始状态 */) {
		return new Promise((resolve, reject) => {
			this.roomid = roomid;// 房间号
			this.anchor_mid = anchor_mid;// 主播的mid
			this.database = database;// 数据库
			this.database_conn = database_conn;// 数据库连接
			this.running = running;// 是否正在运行
			this.auto_stopped = false;// 是否自动暂停
			this.recorded_events = 0;// 记录的事件数

			// SQL插值缓存
			this.buffer = {
				fans_medal: [],
				users_from_danmaku: [],
				users_from_gifts: [],
				users_from_welcome: [],
				users_from_superchat: [],
				danmaku: [],
				welcome_msg: [],
				gifts: [],
				popularity: [],
				json: [],
				followers: [],
				new_guards: [],
				entry_effect: [],
				superchat: []
			};

			// 离上次插值过去的时间
			this.last_query = {
				fans_medal: 0,
				danmaku: 0,
				welcome_msg: 0,
				gifts: 0,
				popularity: 0,
				json: 0,
				followers: 0,
				new_guards: 0,
				entry_effect: 0,
				superchat: 0
			};

			// 统计数据（日志）
			this.statistics = {
				danmaku: 0,
				welcome_msg: 0,
				gifts: 0,
				json: 0
			};

			// 统计数据（邮件）
			this.statistics_email = {
				danmaku: 0,
				welcome_msg: 0,
				gifts: 0,
				json: 0
			};

			var live_conn;// bilibili-live-ws
			// TCP协议
			if (config.connection.protocol.toUpperCase() == "TCP") {
				if (config.connection.doKeep) {
					live_conn = new KeepLiveTCP(roomid, config.connection.host, config.connection.port, config.connection.protover, config.connection.key);
				}
				else {
					live_conn = new LiveTCP(roomid, config.connection.host, config.connection.port, config.connection.protover, config.connection.key);
				}
			}
			// WS协议
			else if (config.connection.protocol.toUpperCase() == "WS") {
				if (config.connection.doKeep) {
					live_conn = new KeepLiveWS(roomid, config.connection.address, config.connection.protover, config.connection.key);
				}
				else {
					live_conn = new LiveWS(roomid, config.connection.address, config.connection.protover, config.connection.key);
				}
			}
			else {
				reject("无法识别您的连接协议！请检查config.js");
			}

			this.live_conn = live_conn;
			log.v0(`直播间${roomid}：已实例化连接`);
			// 连接建立事件
			live_conn.on('open', () => {
				log.v0(`直播间${roomid}：已连接到服务器`);
			});
			// 进入直播间事件
			live_conn.on('live', () => {
				log.v1(`直播间${roomid}：已成功进入直播间`);
				conns.push(this);// 将连接添加到连接列表
				resolve();
			});
			// 连接错误事件
			live_conn.on('error', (e) => {
				reject(e);
			});
		});
	}

	// 配置直播间连接
	this.init = function () {
		// 收到心跳包的回应事件
		this.live_conn.on('heartbeat', (data) => {
			if (config.database.enable_database && this.running && config.data.popularity) {
				// 处理人气数据
				var date = new Date();
				var date_str = formatDate(date);
				this.buffer.popularity.push([data, date_str]);
			}
			if (config.log.log_level == 0 && this.running) {
				log.verbose(this.roomid, `人气：${data}`);
			}
		});

		// 收到直播间event
		this.live_conn.on('msg', (data) => {
			// 开播
			if (data.cmd == 'LIVE') {
				log.verbose(this.roomid, "【主播已开播】");
				if (config.extra.live_only && !this.auto_stopped) {
					this.running = true;
				}
			}

			// 关播
			else if (data.cmd == 'PREPARING') {
				log.verbose(this.roomid, "【主播已关播】");
				if (config.extra.auto_stop) {
					// 停止监控
					this.running = false;
					this.auto_stopped = true;
				}
				else if (config.extra.live_only) {
					this.running = false;
				}
			}

			// 未处在运行状态，则返回
			if (!this.running) {
				return;
			}
			this.recorded_events++;// 总事件数
			var date = new Date();
			var date_str = formatDate(date);

			// 弹幕
			if (data.cmd == 'DANMU_MSG') {
				if (config.log.log_level == 1) {
					this.statistics.danmaku++;
				}
				if (config.email.enabled) {
					this.statistics_email.danmaku++;
				}
				// 以下各字段的含义参考数据库注释
				var info = data.info;
				var anchor_room_id = info[3][3];
				if (typeof (anchor_room_id) == 'undefined') {
					anchor_room_id = 0;
				}
				var anchor_name = info[3][2];
				if (typeof (anchor_name) == 'undefined') {
					anchor_name = '无勋章或主播无效';
				}
				var medal_name = info[3][1];
				if (typeof (medal_name) == 'undefined') {
					medal_name = 'NO MEDAL OR INVALID ANCHOR';
				}
				var mid = info[2][0];
				var username = info[2][1];
				var is_admin = info[2][2];
				var is_vip = info[2][3];
				var is_svip = info[2][4];
				var guard_level = info[7];
				var medal_level = info[3][0];
				if (typeof (medal_level) == 'undefined') {
					medal_level = 0;
				}
				var level = info[4][0];
				var rank = info[4][3];
				if (isNaN(rank)) {
					rank = 0;
				}
				var title = info[5].toString();
				if (title == ',') {
					title = '';
				}
				var pool = info[0][0];
				var mode = info[0][1];
				var font_size = info[0][2];
				var color = info[0][3];
				var timestamp = info[0][4];
				var time = formatDate(timestamp);
				var text = info[1];
				var ct = parseInt(info[9].ct, 16);// 字符串是十六进制的，须转换
				if (config.database.enable_database) {
					// 将数据添加到缓冲区
					this.buffer.fans_medal.push([anchor_room_id, anchor_name, medal_name]);
					this.buffer.users_from_danmaku.push([mid, username, is_admin, is_vip, is_svip, anchor_room_id, medal_level, level, rank, title, guard_level]);
					this.buffer.danmaku.push([pool, mode, font_size, color, time, mid, text, ct]);
				}
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `${username} > ${text}`);
				}
			}

			// 入场
			else if (data.cmd == 'INTERACT_WORD') {
				if (config.log.log_level == 1) {
					this.statistics.welcome_msg++;
				}
				if (config.email.enabled) {
					this.statistics_email.welcome_msg++;
				}
				if (data.data.msg_type != 1) {
					return;
				}
				var mid = data.data.uid;
				var username = data.data.uname;
				var anchor_room_id = data.data.fans_medal.anchor_roomid;
				var guard_level = data.data.fans_medal.guard_level;
				var medal_name = data.data.fans_medal.medal_name;
				var medal_level = data.data.fans_medal.medal_level;
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `    ${username} 进入直播间`);
				}
				if (config.database.enable_database) {
					this.buffer.fans_medal.push([anchor_room_id, '', medal_name]);
					this.buffer.users_from_welcome.push([mid, username, anchor_room_id, medal_level, guard_level]);
					this.buffer.welcome_msg.push([mid, date_str]);
				}
			}

			// 入场效果
			else if (data.cmd == 'ENTRY_EFFECT' && config.data.entry_effect/* 配置里开启了统计功能 */) {
				var origin_id = data.data.id;
				var user_mid = data.data.uid;
				var username = data.data.copy_writing.replace(/^.*?<%/, '').replace(/%>.*?$/, '');
				var privilege_type = data.data.privilege_type;
				if (config.log_dtl == 0) {
					log(`    ${username} 进入直播间`);
				}
				this.buffer.entry_effect.push([origin_id, user_mid, username, privilege_type, date_str]);
			}

			// 送礼
			else if (data.cmd == 'SEND_GIFT') {
				var mid = data.data.uid;
				var username = data.data.uname;
				var gift_id = data.data.giftId;
				var gift_name = data.data.giftName;
				var num = data.data.num;
				var coin_type = data.data.coin_type == 'silver' ? 0 : 1; // @陈睿，给前端说一声，IDE要开启拼写检查功能
				var price = data.data.price;
				var medal_level = data.data.medal_info.medal_level;
				var guard_level = data.data.medal_info.guard_level;
				if (config.log.log_level == 1) {
					this.statistics.gifts += num;
				}
				if (config.email.enabled) {
					this.statistics_email.gifts += num;
				}
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `  ${username} 赠送了 ${num} 个 ${gift_name}`);
				}
				if (config.database.enable_database) {
					this.buffer.users_from_gifts.push([mid, username, medal_level, guard_level]);
					this.buffer.gifts.push([mid, gift_id, gift_name, num, false, date_str, coin_type, price]);
				}
			}

			// 连击送礼
			else if (data.cmd == 'COMBO_SEND') {
				var mid = data.data.uid;
				var username = data.data.uname;
				var gift_id = data.data.gift_id;
				var gift_name = data.data.gift_name;
				var gift_id = data.data.gift_id;
				var num = data.data.combo_num;
				var price = data.data.combo_total_coin / num;
				var medal_level = data.data.medal_info.medal_level;
				var guard_level = data.data.medal_info.guard_level;
				if (config.log.log_level == 1) {
					this.statistics.gifts += num;
				}
				if (config.email.enabled) {
					this.statistics_email.gifts += num;
				}
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `  ${username} 连击赠送了 ${num} 个 ${gift_name}`);
				}
				if (config.database.enable_database) {
					this.buffer.users_from_gifts.push([mid, username, medal_level, guard_level]);
					this.buffer.gifts.push([mid, gift_id, gift_name, num, true, date_str, -1, price]);
				}
			}

			// 购买舰长
			else if (data.cmd == 'GUARD_BUY' && config.data.new_guards/* 配置里开启了统计功能 */) {
				var user_mid = data.data.uid;
				var username = data.data.username;
				var guard_level = data.data.guard_level;
				var num = data.data.num;
				var price = data.data.price;
				var gift_name = data.data.gift_name;
				var time = formatDate(data.data.start_time * 1000);
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `  ${username} 开通了 ${gift_name}`);
				}
				if (config.database.enable_database) {
					this.buffer.new_guards.push([user_mid, username, guard_level, num, price, time]);
				}
			}

			// 醒目留言
			else if (data.cmd == 'SUPER_CHAT_MESSAGE' && config.data.superchat/* 配置里开启了统计功能 */) {
				var user_mid = data.data.uid;
				var username = data.data.user_info.uname;
				var guard_level = data.data.user_info.guard_level;
				var price = data.data.price;
				var time = formatDate(data.data.start_time * 1000);
				var origin_id = data.data.id;
				var duration = data.data.time;
				// 无粉丝勋章
				var anchor_room_id = 0;
				var anchor_name = "无勋章或主播无效";
				var medal_name = "NO MEDAL OR INVALID ANCHOR";
				var medal_level = 0;
				if (data.data.medal_info) {
					// 有粉丝勋章
					anchor_room_id = data.data.medal_info.anchor_roomid;
					anchor_name = data.data.medal_info.anchor_uname;
					medal_name = data.data.medal_info.medal_name;
					medal_level = data.data.medal_info.medal_level;
				}
				var text = data.data.message;
				var is_admin = data.data.user_info.manager;
				var is_main_vip = data.data.user_info.is_main_vip;
				var is_vip = data.data.user_info.is_vip;
				var is_svip = data.data.user_info.is_svip;
				var level = data.data.user_info.user_level;
				var title = data.data.user_info.title;
				var token = parseInt(data.data.token, 16);
				if (title == "0") {
					title = '';
				}
				if (config.log.log_level == 0) {
					log.verbose(this.roomid, `${username} 发布醒目留言：${text}`);
				}
				if (config.database.enable_database) {
					this.buffer.fans_medal.push([anchor_room_id, anchor_name, medal_name]);
					this.buffer.users_from_superchat.push([user_mid, username, is_admin, is_main_vip, is_vip, is_svip, anchor_room_id, medal_level, level, title, guard_level]);
					this.buffer.superchat.push([origin_id, time, price, duration, user_mid, text, token]);
				}
			}

			// 直播事件json
			if (config.data.json && config.database.enable_database) {
				this.buffer.json.push([date_str, data.cmd, JSON.stringify(data)]);
			}
			if (config.log.log_level == 1) {
				this.statistics.json++;
			}
			if (config.email.enabled) {
				this.statistics_email.json++;
			}
		});

		// 连接错误事件
		this.live_conn.on('error', (e) => {
			log.error(this.roomid, e);
		});

		// 进行setInterval等操作
		if (!ready) {
			ready = true;
			// 数据库插值
			if (config.database.enable_database) {
				setInterval(task, config.database.buf_interval);
			}

			// 打印统计信息
			if (config.log.log_level == 1) {
				setInterval(function () {
					for (var i = 0; i < conns.length; i++) {
						var conn = conns[i];
						if (conn.running) {
							log.verbose(conn.roomid, `${formatDate(new Date())}  过去的一分钟共收到\n${conn.statistics.danmaku}条弹幕，${conn.statistics.gifts}个礼物，${conn.statistics.welcome_msg}条入场信息，总事件数为${conn.statistics.json}\n`);
						}
						// 重置统计信息
						conn.statistics = {
							danmaku: 0,
							welcome_msg: 0,
							gifts: 0,
							json: 0
						}
					}
				}, 60000);
			}

			// 定时查询粉丝数
			if (config.data.followers) {
				setInterval(async function () {
					try {
						for (var i = 0; i < conns.length; i++) {
							var start_time = Date.now();
							var conn = conns[i];
							if (conn.running) {
								var data = liveroomHandler.getAnchorInfo(conn.anchor_mid);
								if (config.database.enable_database) {
									var date = new Date();
									var date_str = formatDate(date);
									conn.buffer.followers.push([data.follower_num, date_str]);// 添加到缓冲区
								}
								if (config.log.log_level == 0) {
									log.verbose(conn.roomid, `粉丝数：${data.follower_num}`);
								}
							}
							var end_time = Date.now();
							// 休眠
							var time = (config.data.followers_interval * 1000) / conns.length - (end_time - start_time);
							if (time < 0) {
								time = 0;
							}
							await new Promise((resolve, reject) => {
								setTimeout(function () {
									resolve();
								}, time);
							});
						}
					}
					catch (e) {
						log.error(conn.roomid, e);
					}
				}, config.data.followers_interval * 1000);
			}

			// 如所有连接都自动终止，则安全停止监控
			if (config.extra.auto_stop) {
				setInterval(function () {
					if (conns.length == 0) {
						return;
					}
					for (var i = 0; i < conns.length; i++) {
						if (!conns[i].auto_stopped) {
							return;
						}
					}
					conns[0].finish();
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
						setTimeout(() => { process.exit(0); }, 1000);
					}, 1000);
				}, 1000);
			}
		}
	}

	// 安全退出时调用，立即插值
	this.finish = function () {
		for (var i = 0; i < conns.length; i++) {
			conns[i].last_query = query_right_now;
		}
		if (config.database.enable_database) {
			task();
		}
		// 接下来等待SQL命令执行完毕
	}
}

// 数据库插值的任务
function task() {
	for (var i = 0; i < conns.length; i++) {
		var conn = conns[i];
		// 粉丝勋章
		if (conn.buffer.fans_medal.length >= config.database.amount || conn.last_query.fans_medal >= config.database.sql_interval * 1000 && conn.buffer.fans_medal.length > 0) {
			// 把粉丝勋章数组分成有无主播用户名的两类
			var temp_array = conn.buffer.fans_medal.splice(0, conn.buffer.fans_medal.length);
			var with_anchor_name = [];
			var without_anchor_name = [];
			for (var i = 0; i < temp_array.length; i++) {
				// 忽略无勋章
				if (temp_array[i][0] == 0) {
					continue;
				}
				if (temp_array[i][1] == '') {
					without_anchor_name.push(temp_array[i]);
				}
				else {
					with_anchor_name.push(temp_array[i]);
				}
			}

			if (config.extra.override/* 是否启用数据覆盖 */) {
				if (with_anchor_name.length > 0) {
					conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES ? ON DUPLICATE KEY UPDATE anchor_name=VALUES(anchor_name), medal_name=VALUES(medal_name)', [with_anchor_name]);
				}
				if (without_anchor_name.length > 0) {
					conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES ? ON DUPLICATE KEY UPDATE medal_name=VALUES(medal_name)', [without_anchor_name]);
				}
			}
			else {
				if (with_anchor_name.length > 0) {
					conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES ? ON DUPLICATE KEY UPDATE anchor_name=VALUES(anchor_name)', [with_anchor_name]);
				}
				if (without_anchor_name.length > 0) {
					conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT IGNORE INTO fans_medal (anchor_room_id, anchor_name, medal_name) VALUES ?', [without_anchor_name]);
				}
			}
			conn.last_query.fans_medal = 0;// 将上次插值距离现在的时间设为0
		}
		else {
			conn.last_query.fans_medal += config.database.buf_interval;// 增加上次插值距离现在的时间
		}

		// 弹幕及用户
		if (conn.buffer.danmaku.length >= config.database.amount || conn.last_query.danmaku >= config.database.sql_interval * 1000 && conn.buffer.danmaku.length > 0) {
			if (config.extra.override) {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO users_from_danmaku (user_mid, username, is_admin, is_vip, is_svip, medal, medal_level, level, rank, title, guard_level) VALUES ? ON DUPLICATE KEY UPDATE username=VALUES(username), is_admin=VALUES(is_admin), is_vip=VALUES(is_vip), is_svip=VALUES(is_svip), medal=VALUES(medal), medal_level=VALUES(medal_level), level=VALUES(level), rank=VALUES(rank), title=VALUES(title), guard_level=VALUES(guard_level)', [conn.buffer.users_from_danmaku.splice(0, conn.buffer.users_from_danmaku.length)]);
			}
			else {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT IGNORE INTO users_from_danmaku (user_mid, username, is_admin, is_vip, is_svip, medal, medal_level, level, rank, title, guard_level) VALUES ?', [conn.buffer.users_from_danmaku.splice(0, conn.buffer.users_from_danmaku.length)]);
			}
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO danmaku (pool, mode, font_size, color, time, user_mid, text, ct) VALUES ?', [conn.buffer.danmaku.splice(0, conn.buffer.danmaku.length)]);
			conn.last_query.danmaku = 0;
		}
		else {
			conn.last_query.danmaku += config.database.buf_interval;
		}

		// 礼物及用户
		if (conn.buffer.gifts.length >= config.database.amount || conn.last_query.gifts >= config.database.sql_interval * 1000 && conn.buffer.gifts.length > 0) {
			if (config.extra.override) {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO users_from_gifts (user_mid, username, medal_level, guard_level) VALUES ? ON DUPLICATE KEY UPDATE username=VALUES(username), medal_level=VALUES(medal_level), guard_level=VALUES(guard_level)', [conn.buffer.users_from_gifts.splice(0, conn.buffer.users_from_gifts.length)]);
			}
			else {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT IGNORE INTO users_from_gifts (user_mid, username, medal_level, guard_level) VALUES ?', [conn.buffer.users_from_gifts.splice(0, conn.buffer.users_from_gifts.length)]);
			}
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO gifts (user_mid, gift_id, gift_name, num, is_combo_send, time, coin_type, price) VALUES ?', [conn.buffer.gifts.splice(0, conn.buffer.gifts.length)]);
			conn.last_query.gifts = 0;
		}
		else {
			conn.last_query.gifts += config.database.buf_interval;
		}

		// 入场信息及用户
		if (conn.buffer.welcome_msg.length >= config.database.amount || conn.last_query.welcome_msg >= config.database.sql_interval * 1000 && conn.buffer.welcome_msg.length > 0) {
			if (config.extra.override) {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO users_from_welcome (user_mid, username, medal, medal_level, guard_level) VALUES ? ON DUPLICATE KEY UPDATE username=VALUES(username), medal=VALUES(medal), medal_level=VALUES(medal_level), guard_level=VALUES(guard_level)', [conn.buffer.users_from_welcome.splice(0, conn.buffer.users_from_welcome.length)]);
			}
			else {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT IGNORE INTO users_from_welcome (user_mid, username, medal, medal_level, guard_level) VALUES ?', [conn.buffer.users_from_welcome.splice(0, conn.buffer.users_from_welcome.length)]);
			}
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO welcome_msg (user_mid, time) VALUES ?', [conn.buffer.welcome_msg.splice(0, conn.buffer.welcome_msg.length)]);
			conn.last_query.welcome_msg = 0;
		}
		else {
			conn.last_query.welcome_msg += config.database.buf_interval;
		}

		// 醒目留言及用户
		if (conn.buffer.superchat.length >= config.database.amount || conn.last_query.superchat >= config.database.sql_interval * 1000 && conn.buffer.superchat.length > 0) {
			if (config.extra.override) {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO users_from_superchat (user_mid, username, is_admin,  is_main_vip, is_vip, is_svip, medal, medal_level, level, title, guard_level) VALUES ? ON DUPLICATE KEY UPDATE username=VALUES(username), is_admin=VALUES(is_admin), is_main_vip=VALUES(is_main_vip), is_vip=VALUES(is_vip), is_svip=VALUES(is_svip), medal=VALUES(medal), medal_level=VALUES(medal_level), level=VALUES(level), title=VALUES(title), guard_level=VALUES(guard_level)', [conn.buffer.users_from_superchat.splice(0, conn.buffer.users_from_superchat.length)]);
			}
			else {
				conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT IGNORE INTO users_from_superchat (user_mid, username, is_admin, is_main_vip, is_vip, is_svip, medal, medal_level, level, title, guard_level) VALUES ?', [conn.buffer.users_from_superchat.splice(0, conn.buffer.users_from_superchat.length)]);
			}
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO superchat (origin_id, time, price, duration, user_mid, text, token) VALUES ?', [conn.buffer.superchat.splice(0, conn.buffer.superchat.length)]);
			conn.last_query.superchat = 0;
		}
		else {
			conn.last_query.superchat += config.database.buf_interval;
		}

		// 人气值
		if (conn.buffer.popularity.length >= config.database.amount || conn.last_query.popularity >= config.database.sql_interval * 1000 && conn.buffer.popularity.length > 0) {
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO popularity (popularity, time) VALUES ?', [conn.buffer.popularity.splice(0, conn.buffer.popularity.length)]);
			conn.last_query.popularity = 0;
		}
		else {
			conn.last_query.popularity += config.database.buf_interval;
		}

		// 粉丝数据
		if (conn.buffer.followers.length >= config.database.amount || conn.last_query.followers >= config.database.sql_interval * 1000 && conn.buffer.followers.length > 0) {
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO followers (followers, time) VALUES ?', [conn.buffer.followers.splice(0, conn.buffer.followers.length)]);
			conn.last_query.followers = 0;
		}
		else {
			conn.last_query.followers += config.database.buf_interval;
		}

		// 购买舰长
		if (conn.buffer.new_guards.length >= config.database.amount || conn.last_query.new_guards >= config.database.sql_interval * 1000 && conn.buffer.new_guards.length > 0) {
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO new_guards (user_mid, username, guard_level, num, price, time) VALUES ?', [conn.buffer.new_guards.splice(0, conn.buffer.new_guards.length)]);
			conn.last_query.new_guards = 0;
		}
		else {
			conn.last_query.new_guards += config.database.buf_interval;
		}

		// 入场效果
		if (conn.buffer.entry_effect.length >= config.database.amount || conn.last_query.entry_effect >= config.database.sql_interval * 1000 && conn.buffer.entry_effect.length > 0) {
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO entry_effect (origin_id, user_mid, username, privilege_type, time) VALUES ?', [conn.buffer.entry_effect.splice(0, conn.buffer.entry_effect.length)]);
			conn.last_query.entry_effect = 0;
		}
		else {
			conn.last_query.entry_effect += config.database.buf_interval;
		}

		// 事件json
		if (conn.buffer.json.length >= config.database.amount || conn.last_query.json >= config.database.sql_interval * 1000 && conn.buffer.json.length > 0) {
			conn.database.queryAsync(conn.roomid, conn.database_conn, 'INSERT INTO json (time, cmd, json) VALUES ?', [conn.buffer.json.splice(0, conn.buffer.json.length)]);
			conn.last_query.json = 0;
		}
		else {
			conn.last_query.json += config.database.buf_interval;
		}
	}
}

// 格式化日期
function formatDate(date) {
	var date = new Date(date);
	var YY = date.getFullYear() + '-';
	var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
	var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
	var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
	var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
	var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
	return YY + MM + DD + " " + hh + mm + ss;
}

// 导出模块
module.exports = Connection;
