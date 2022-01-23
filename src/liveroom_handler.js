/* 
 * 直播间处理
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

const xmlhttprequest = require('xmlhttprequest');
const config = require('../config');

function LiveroomHandler() {
	// 获取主播mid
	this.getMid = function (roomid) {
		var xhr = new xmlhttprequest.XMLHttpRequest();
		xhr.open('GET', `http${config.connection.https ? 's' : ''}://api.live.bilibili.com/room/v1/Room/room_init?id=${roomid}`, false);
		xhr.send();
		var result = xhr.status;
		if (result == 200) {
			var root = JSON.parse(xhr.responseText);
			if (root.code == 0) {
				var data = root.data;
				return data.uid;
			}
			else {
				throw root.message;
			}
		}
		else {
			throw `网络异常，错误码为${xhr.status}`;
		}
	}

	// 获取主播信息
	this.getAnchorInfo = function (mid) {
		var xhr = new xmlhttprequest.XMLHttpRequest();
		xhr.open('GET', `http${config.connection.https ? 's' : ''}://api.live.bilibili.com/live_user/v1/Master/info?uid=${mid}`, false);
		xhr.send();
		var result = xhr.status;
		if (result == 200) {
			var root = JSON.parse(xhr.responseText);
			if (root.code == 0) {
				return root.data;
			}
			else {
				throw root.message;
			}
		}
		else {
			throw `网络异常，错误码为${xhr.status}`;
		}
	}

	// 获取直播间真实id和状态
	this.getTrueIdAndStatus = function (roomid) {
		var xhr = new xmlhttprequest.XMLHttpRequest();
		xhr.open('GET', `http${config.connection.https ? 's' : ''}://api.live.bilibili.com/room/v1/Room/room_init?id=${roomid}`, false);
		xhr.send();
		var result = xhr.status;
		if (result == 200) {
			var root = JSON.parse(xhr.responseText);
			if (root.code == 0) {
				var data = root.data;
				var room_id = data.room_id;
				var status = data.live_status;
				return {
					"trueId": room_id,
					"status": status
				}
			}
			else {
				throw root.message;
			}
		}
		else {
			throw `网络异常，错误码为${xhr.status}`;
		}
	}

	// 测试直播间可用性
	this.testRoomAvailability = function (roomid) {
		var xhr = new xmlhttprequest.XMLHttpRequest();
		xhr.open('GET', `http${config.connection.https ? 's' : ''}://api.live.bilibili.com/room/v1/Room/room_init?id=${roomid}`, false);
		xhr.send();
		var result = xhr.status;
		if (result == 200) {
			var root = JSON.parse(xhr.responseText);
			if (root.code == 0) {
				var data = root.data;
				var is_hidden = data.is_hidden;
				if (is_hidden) {
					throw "直播间已隐藏";
				}
				var is_locked = data.is_locked;
				if (is_locked) {
					throw "直播间已锁定";
				}
				var encrypted = data.encrypted;
				if (encrypted) {
					throw "直播间已加密";
				}
				return true;
			}
			else {
				throw root.message;
			}
		}
		else {
			throw `网络异常，错误码为${xhr.status}`;
		}
	}
}

// 导出模块
module.exports = LiveroomHandler;
