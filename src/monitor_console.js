/* 
 * 监控控制台
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

var config;
try {
	config = require('../config');
}
catch (e) {
	// config.js有语法错误
	console.log("无法读取config.js！请检查括号是否成对，以及是否使用半角符号。");
	console.log(e);
	process.exit(0);
}
const net = require("net");
const readline = require('readline');

// 读取标准输入
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// TCP客户端
var client = net.connect({ port: config.extra.console_port }, function () {
	console.log('已连接到直播间监控');
});

client.on('data', function (data) {
	// 服务器发来断开连接指令
	if (new RegExp("/disconnect").test(data.toString().toLowerCase())) {
		client.end();
	}
	else {
		console.log(data.toString());
	}
});

client.on('end', function () {
	console.log('已断开与监控的连接');
	rl.close();
	process.exit(0);
});

client.on('error', function () {
	console.log("无法连接本地TCP服务器");
	rl.close();
	process.exit(0);
});

rl.question("", recurse);

// 递归调用
function recurse(answer) {
	answer = answer.trim().toLowerCase();
	if (answer == "") {
		client.write("/refresh");
	}
	else if (answer == "q") {
		client.end();
		rl.close();
		process.exit(0);
	}
	else {
		client.write(answer);
	}
	rl.question("", recurse);
}
