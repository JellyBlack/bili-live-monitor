/* 
 * 钉钉和邮件通知
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const xmlhttprequest = require('xmlhttprequest');
const nodemailer = require("nodemailer");
const config = require('../config');
const Log = require('./log');
var log = new Log();

// 钉钉通知
exports.notifyViaDingTalk = function (msg) {
	if (config.dingtalk.enabled) {
		var xhr = new xmlhttprequest.XMLHttpRequest();
		xhr.open('POST', config.dingtalk.webhook, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.onload = function (e) {
			if (this.status == 200) {
				var response = JSON.parse(this.responseText);
				if (response.errcode != 0) {
					log.v2(`无法发送钉钉通知\n错误码：${response.errcode}，错误内容：${response.errmsg}`);
				}
			}
			else {
				log.v2("无法发送钉钉通知");
			}
		};
		xhr.ontimeout = function (e) {
			log.v2("无法发送钉钉通知");
		};
		xhr.onerror = function (e) {
			log.v2("无法发送钉钉通知：" + e);
		};
		var json = {
			msgtype: "text",
			text: {
				content: "bili-live-monitor\n" + msg
			}
		};
		xhr.send(JSON.stringify(json));
	}
}

// 邮件通知
exports.notifyViaEmail = function (subject, msg) {
	var transporter = nodemailer.createTransport({
		host: config.email.smtp,
		auth: {
			user: config.email.email_from,
			pass: config.email.password
		}
	});
	var mail_to = config.email.email_from;
	if (config.email.email_to != "") {
		mail_to = config.email.email_to;
	}
	var mailOptions = {
		from: config.email.email_from,
		to: mail_to,
		subject: subject,
		html: msg
	}
	try {
		transporter.sendMail(mailOptions, function (err, info) {
			if (error) {
				log.v2(`发送邮件错误：${error}`);
			}
		});
	}
	catch (e) {
		log.v2(`发送邮件错误：${e}`);
	}
}
