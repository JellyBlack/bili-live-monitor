/* 
 * 存储建表语句的js
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const config = require('../config');
const flag = config.database.enable_comment;

const queries = {
	"danmaku": `CREATE TABLE IF NOT EXISTS danmaku ( 
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	pool TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '弹幕池'" : ""} ,
	mode TINYINT NOT NULL DEFAULT '1' ${flag ? "COMMENT '弹幕模式 1：从右至左滚动弹幕 6：从左至右滚动弹幕 5：顶端固定弹幕 4：底端固定弹幕 7：高级弹幕 8：脚本弹幕'" : ""} ,
	font_size TINYINT UNSIGNED NOT NULL DEFAULT '25' ${flag ? "COMMENT '字号'" : ""} ,
	color INT UNSIGNED NOT NULL DEFAULT '16777215' ${flag ? "COMMENT '弹幕颜色代码'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '弹幕发送时间'" : ""} ,
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	text TEXT NOT NULL ${flag ? "COMMENT '弹幕内容'" : ""} ,
	ct INT UNSIGNED NOT NULL ${flag ? "COMMENT '校验信息'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (user_mid) REFERENCES users_from_danmaku (user_mid)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '弹幕'" : ""};`,

	"json": `CREATE TABLE IF NOT EXISTS json (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '收到事件的时间'" : ""} ,
	cmd TEXT NOT NULL ${flag ? "COMMENT '事件类型（cmd）'" : ""} ,
	json TEXT NOT NULL ${flag ? "COMMENT '事件的json'" : ""} ,
	PRIMARY KEY (id)) ENGINE = InnoDB ${flag ? "COMMENT = '直播间事件'" : ""};`,

	"users_from_danmaku": `CREATE TABLE IF NOT EXISTS users_from_danmaku (
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	is_admin BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为房管'" : ""} ,
	is_vip BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为老爷'" : ""} ,
	is_svip BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为年费老爷'" : ""} ,
	medal INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章对应主播的房间号'" : ""} ,
	medal_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章等级'" : ""} ,
	level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '用户的直播间等级'" : ""} ,
	rank SMALLINT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '排名，大于50000名标识为0'" : ""} ,
	title TEXT NOT NULL ${flag ? "COMMENT '用户头衔'" : ""} ,
	guard_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '大航海等级 0：普通用户 1：总督 2：提督 3：舰长'" : ""} ,
	PRIMARY KEY (user_mid)${config.database.enable_index ? ", INDEX (username) , INDEX (medal)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (medal) REFERENCES fans_medal (anchor_room_id)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '从弹幕采集到的用户信息'" : ""};`,

	"fans_medal": `CREATE TABLE IF NOT EXISTS fans_medal (
	anchor_room_id INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '主播房间号'" : ""} ,
	anchor_name VARCHAR(50) NOT NULL ${flag ? "COMMENT '主播用户名'" : ""} ,
	medal_name VARCHAR(50) NOT NULL ${flag ? "COMMENT '粉丝勋章名称'" : ""} ,
	PRIMARY KEY (anchor_room_id)${config.database.enable_index ? ", INDEX (anchor_name), INDEX (medal_name)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '粉丝勋章（含各种渠道记录的）'" : ""};`,

	"gifts": `CREATE TABLE IF NOT EXISTS gifts (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	gift_id MEDIUMINT UNSIGNED NOT NULL ${flag ? "COMMENT '礼物id'" : ""} ,
	gift_name TEXT NOT NULL ${flag ? "COMMENT '礼物名称'" : ""} ,
	num MEDIUMINT UNSIGNED NOT NULL DEFAULT '1' ${flag ? "COMMENT '礼物数量'" : ""} ,
	is_combo_send BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否连击送礼'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '送礼时间'" : ""} ,
	coin_type TINYINT(1) NOT NULL DEFAULT '0' ${flag ? "COMMENT '瓜子种类 0：银瓜子 1：金瓜子 -1：未知'" : ""} ,
	price MEDIUMINT UNSIGNED NOT NULL ${flag ? "COMMENT '礼物单价'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (user_mid) REFERENCES users_from_gifts (user_mid)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '直播间送礼信息'" : ""};`,

	"users_from_gifts": `CREATE TABLE IF NOT EXISTS users_from_gifts (
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	medal_level TINYINT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章等级'" : ""} ,
	guard_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '大航海等级 0：普通用户 1：总督 2：提督 3：舰长'" : ""} ,
	PRIMARY KEY (user_mid)${config.database.enable_index ? ", INDEX (username)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '从礼物采集到的用户信息'" : ""};`,

	"welcome_msg": `CREATE TABLE IF NOT EXISTS welcome_msg (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '入场时间'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (user_mid) REFERENCES users_from_welcome (user_mid)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '观众的入场信息'" : ""};`,

	"users_from_welcome": `CREATE TABLE IF NOT EXISTS users_from_welcome (
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	medal INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章对应主播的房间号'" : ""} ,
	medal_level TINYINT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章等级'" : ""} ,
	guard_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '大航海等级 0：普通用户 1：总督 2：提督 3：舰长'" : ""} ,
	PRIMARY KEY (user_mid)${config.database.enable_index ? ", INDEX (username) , INDEX (medal)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (medal) REFERENCES fans_medal (anchor_room_id)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '从入场采集到的用户信息'" : ""};`,

	"popularity": `CREATE TABLE IF NOT EXISTS popularity (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	popularity INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '人气值'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '采集时间'" : ""} ,
	PRIMARY KEY (id)) ENGINE = InnoDB ${flag ? "COMMENT = '人气值'" : ""};`,

	"followers": `CREATE TABLE IF NOT EXISTS followers (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	followers INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝数'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '采集时间'" : ""} ,
	PRIMARY KEY (id)) ENGINE = InnoDB ${flag ? "COMMENT = '粉丝数'" : ""};`,

	"new_guards": `CREATE TABLE IF NOT EXISTS new_guards (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	user_mid INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	guard_level TINYINT NOT NULL DEFAULT '3' ${flag ? "COMMENT '大航海等级 0：普通用户 1：总督 2：提督 3：舰长'" : ""} ,
	num INT UNSIGNED NOT NULL DEFAULT '1' ${flag ? "COMMENT '购买数量'" : ""} ,
	price INT UNSIGNED NOT NULL DEFAULT '198000' ${flag ? "COMMENT '消耗金瓜子的数量'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '购买时间'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid), INDEX (username)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '购买舰长信息'" : ""};`,

	"entry_effect": `CREATE TABLE IF NOT EXISTS entry_effect (
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	origin_id INT NOT NULL DEFAULT '0' ${flag ? "COMMENT '原始json里的id字段'" : ""} ,
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	privilege_type SMALLINT NOT NULL DEFAULT '3' ${flag ? "COMMENT '特权类型'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '入场时间'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid), INDEX (username)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '入场效果'" : ""};`,

	"superchat": `CREATE TABLE IF NOT EXISTS superchat ( 
	id INT NOT NULL AUTO_INCREMENT ${flag ? "COMMENT '主键'" : ""} ,
	origin_id INT NOT NULL DEFAULT '0' ${flag ? "COMMENT '原始json里的id字段'" : ""} ,
	time DATETIME NOT NULL ${flag ? "COMMENT '醒目留言发送时间'" : ""} ,
	price INT UNSIGNED NOT NULL DEFAULT '30' ${flag ? "COMMENT '醒目留言价格'" : ""} , 
	duration INT UNSIGNED NOT NULL DEFAULT '60' ${flag ? "COMMENT '醒目留言持续时间，单位为秒'" : ""} , 
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	text TEXT NOT NULL ${flag ? "COMMENT '弹幕内容'" : ""} ,
	token INT UNSIGNED NOT NULL ${flag ? "COMMENT 'json里的token字段'" : ""} ,
	PRIMARY KEY (id)${config.database.enable_index ? ", INDEX (user_mid)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (user_mid) REFERENCES users_from_superchat (user_mid)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '醒目留言'" : ""};`,

	"users_from_superchat": `CREATE TABLE IF NOT EXISTS users_from_superchat (
	user_mid INT UNSIGNED NOT NULL ${flag ? "COMMENT '用户的mid'" : ""} ,
	username VARCHAR(50) NOT NULL ${flag ? "COMMENT '用户名'" : ""} ,
	is_admin BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为房管'" : ""} ,
	is_main_vip BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为主站大会员'" : ""} ,
	is_vip BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为老爷'" : ""} ,
	is_svip BOOLEAN NOT NULL DEFAULT FALSE ${flag ? "COMMENT '是否为年费老爷'" : ""} ,
	medal INT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章对应主播的房间号'" : ""} ,
	medal_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '粉丝勋章等级'" : ""} ,
	level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '用户的直播间等级'" : ""} ,
	rank SMALLINT UNSIGNED NOT NULL DEFAULT '0' ${flag ? "COMMENT '排名，大于50000名标识为0'" : ""} ,
	title TEXT NOT NULL ${flag ? "COMMENT '用户头衔'" : ""} ,
	guard_level TINYINT NOT NULL DEFAULT '0' ${flag ? "COMMENT '大航海等级 0：普通用户 1：总督 2：提督 3：舰长'" : ""} ,
	PRIMARY KEY (user_mid)${config.database.enable_index ? ", INDEX (username) , INDEX (medal)" : ""}
	${config.database.enable_foreign_key ? ", FOREIGN KEY (medal) REFERENCES fans_medal (anchor_room_id)" : ""}) ENGINE = InnoDB ${flag ? "COMMENT = '从醒目留言采集到的用户信息'" : ""};`
}

// 导出模块
module.exports = queries;
