/* 
 * 监控的配置文件
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

var config = {
	// 房间号，填非正数表示禁用，长号短号均可，可指定多个，用半角逗号分隔。
	// 示例一：[123456]    示例二：[12345, 23456, 34567, 45678, 56789]
	"live_room": [5440, 544614, 7734200],

	// 可选的监控数据
	"data": {
		// 以下数据可选，如需要记录，则指定为true，反之为false
		// 人气值（每次发心跳包时更新）
		"popularity": true,

		// 主播粉丝数
		"followers": false,

		// 粉丝数更新间隔，单位为秒（如房间较多，不要设置过短，否则请求容易被拦截）
		"followers_interval": 60,

		// 购买舰长
		"new_guards": true,

		// 入场效果（比如欢迎舰长进入直播间）
		"entry_effect": true,

		// 醒目留言（Super Chat）
		"superchat": true,

		// 所有直播事件json（非常占空间，一般用于调试）
		// 受限于MySQL版本问题，json统一存储为文本格式
		"json": false
	},

	// 其他监控选项
	"extra": {
		// 是否进行房间校验
		// 强烈建议开启！用户界面获取的房间号会优先显示为短号，而API要求的是长号，房间校验功能可以自动转换。
		// 禁用后，须把上面可选的监控数据-主播粉丝数一并禁用，否则会报错
		"room_check": true,

		// 哔哩哔哩API的请求间隔，单位为毫秒
		// 如请求间隔基准值为1000ms，随机值为400ms, 则每两次请求之间会随机暂停600ms~1400ms；二者都设为0则禁用请求间隔
		// 请求间隔基准值
		"interval_base": 1000,

		// 请求间隔随机值
		"interval_random": 400,

		// 仅监控开播时的数据，关播或轮播时的数据不记录
		// 如已触发下面“停止监控”，则即使开播也不会记录
		// 如已关闭房间校验，则默认直播间为开播状态
		"live_only": false,

		// 关播则停止监控
		// 注：如果主播临时掉线，也会停止监控，以后的数据都不会记录
		// 如所有直播间的监控都停止，则会自动安全退出
		// 可进入控制台切换状态至运行中，以清除“停止监控”状态
		"auto_stop": false,

		// 是否启用数据覆盖
		// 启用：采集到的用户信息等将保持最新，但可能造成很多重复的写入操作
		// 禁用：用户信息在采集一次之后不再更新，短期监控（数小时内）建议禁用
		"override": true,

		// 监控(src/main.js)和控制台(src/monitor_console.js)通信时使用的端口，范围为1024-65535
		"console_port": 4553
	},

	// 数据库（勿手动更改生成的数据库的结构）
	"database": {
		// 是否写入数据库，指定为false则数据不会写入数据库中，以下数据库设置无效
		"enable_database": true,

		// 数据库地址，本机地址则填localhost
		"host": "localhost",

		// 端口，默认3306（MySQL）
		"port": 3306,

		// 用户
		"user": "live-monitor",

		// 密码，若无需密码登录则指定为空字符串
		"password": "",

		/* 
		 * 数据库名称，指定为空则默认“live_%roomid%_stats"
		 * 注意：如同时监控多个直播间，数据库勿指定为静态名称
		 * 支持的动态填充字段：
		 * %roomid% 房间号
		 * %mid% 主播的mid
		 * %date% 当前日期，格式为yyyyMMdd
		 * %time% 当前时间，格式为HHmmss
		 * %random% 创建1位随机数字，如需要3位，则应写为%random%%random%%random%
		 */
		"database_name": "",

		/* 
		 * 数据库已存在的处理方案
		 * "APPEND"（默认） : 追加数据到已有数据库中
		 * "NEW" : 尝试在名称后面追加8位随机数字，并创建数据库
		 * "RECREATE" : 删除数据库并重新创建（危险！）
		 * "NOTHING" : 不处理并报告异常
		 */
		"what_to_do_when_existing": "APPEND",

		// 说明：以下三个选项仅第一次创建数据表时有效
		// 是否启用外键
		// 警告：启用外键可能造成因SQL执行顺序不确定导致的无法插值问题
		"enable_foreign_key": false,

		// 是否除主键、外键外为某些字段创建索引，建议开启
		"enable_index": true,

		// 是否为数据表、字段添加注释
		"enable_comment": true,

		// 是否用utf8mb4字符集代替utf8字符集（需MySQL 5.5及以后版本）
		// 新安装的MySQL一般都在5.5版本以后。如符合版本要求，强烈建议开启。否则如果有人在弹幕里发Emoji表情，可能无法记录。
		"utf8mb4": true,

		// 批量插值数量，记录数达到此值后运行SQL查询。不建议设置过小
		"amount": 50,

		// 插值时间间隔，定时运行SQL查询，即使没达到批量插值数量。可防止数据滞留过久。单位为秒
		"sql_interval": 10,

		// 缓冲区监测间隔，每隔多久检测一次是否达到批量插值数量或插值时间间隔。单位为毫秒
		"buf_interval": 1000
	},

	// 日志输出
	"log": {
		// 是否启用日志输出，指定为false则控制台不会打印日志，也不会写入日志文件，以下日志输出设置无效
		"enable_log": true,

		/* 
		 * 日志等级
		 * 0 : 打印所有日志信息，比如弹幕、送礼、错误信息（记得清理日志文件！）
		 * 1 : 打印较少信息，比如一分钟内接收到的弹幕数量。包含错误信息
		 * 2 : 仅打印错误信息
		 */
		"log_level": 1
	},

	// 网络连接，该部分可参考https://github.com/simon300000/bilibili-live-ws
	"connection": {
		// 是否启用HTTPS
		"https": true,

		// 协议，可选TCP和WS
		"protocol": "TCP",

		// 是否断线重新连接
		"doKeep": true,

		// WebSocket连接的地址，留空则为默认
		"address": "",

		// TCP连接的地址，留空则为默认
		"host": "",

		// TCP连接的端口，默认为2243
		"port": 2243,

		// 默认为2
		"protover": 2,

		// 可选, WS握手的Token
		"key": ""
	},

	// HTTP服务器选项，用于展示图表
	"server": {
		// 侦听主机，填空字符串则侦听本机（只能本机访问）
		// 如在云服务器运行，并希望所有因特网上的设备都能访问，则填"0.0.0.0"
		// 如在云服务器上运行，请慎重向外网开放！因向外网开放导致服务器遭攻击等，开发者概不负责
		"host": "",

		// 端口
		"port": 8080
	},

	// 弹幕合并选项，所有设置项和说明来自pakku.js（https://github.com/xmcp/pakku.js）
	// 感谢pakku.js的开发者和贡献者@xmcp @dramforever @fanthos @sxei
	// 该功能在工具箱里，运行“npm run tools”以使用。
	"combine": {
		// 编辑距离合并强度：根据编辑距离判断不完全一致但内容相近（例如有错别字）的弹幕
		// 能有效击杀 "你指尖跃动的电光" 和 "你之间跃动的电光" 等。默认为“≤5”
		// 禁用：≤0  轻微：≤3  中等：≤5  强力：≤8
		"edit_distance": "≤5",

		// 词频向量合并强度：根据 2-Gram 频率向量的夹角判断不完全一致但内容类似的弹幕
		// 能有效击杀 "yeah!~" 和 "yeah!~yeah!~yeah!~yeah!~" 等。默认为“60%”
		// 禁用：101%  轻微：85%  中等：60%  强力：30%  （任意大于100%的数值都表示禁用）
		"max_cosine": "60%",

		// 识别谐音弹幕： 将常用汉字转换为拼音再进行比较
		// 能有效击杀 "布拉迪巴特福来" 和 "布拉迪·八德福莱" 等。
		"pinyin": true,

		// 忽略末尾标点
		"ending": true,

		// 忽略多余空格
		"space": true,

		// 忽略全半角差异
		"width": true
	},

	// 钉钉通知，更多信息参见README文档，通知重要日志和统计数据
	"dingtalk": {
		// 是否启用钉钉通知
		"enabled": false,

		// Webhook地址
		// 例如：https://oapi.dingtalk.com/robot/send?access_token=XXXXXX
		"webhook": "",

		// 统计信息发送间隔，单位为分钟，不小于1
		"interval": 60,
	},

	// 邮件通知，更多信息参见README文档，仅通知统计数据
	"email": {
		// 是否启用邮件通知
		"enabled": false,

		// 发送邮箱
		"email_from": "",

		// SMTP地址，请确保你的发送邮箱开启了SMTP服务，如smtp.qq.com
		"smtp": "",

		// 发送邮箱的密码或授权码
		// QQ、126等邮箱要求授权码，Gmail用密码即可
		"password": "",

		// 接收邮箱，支持多个。填空字符串则发送给自己
		"email_to": "",

		// 统计信息发送间隔，单位为分钟，不小于5
		"interval": 360
	}
}

// 封装配置文件
module.exports = config;
