/* 
 * 前端js
 * by JellyBlack (https://github.com/JellyBlack/bili-live-monitor)
 */

var echart;// EChart实例
var option;// EChart选项
var width = 60;// 默认时间粒度
var database_index = -1;// 当前的数据库
var chart_type = "none";// 图表类型
var data;// 从服务器接收的数据
var final_data;// 准备传给ECharts的数据
var name;// ECharts图表名称
var databases = []; // 数据库列表
var request_combined = false;// 是否请求合并后的弹幕
var source = "danmaku";// 用户来源
var danmaku_legend = ["time"];// 用于弹幕数量折线图（排行）
$(function () {
	// 获取可用的数据库列表
	$.get("getDatabases", function (data, status) {
		if (status == "success") {
			data.forEach((element) => {
				$("#database_selector").append(`<option value="${element.database_name}">${element.display}</option>`);
				databases.push(element.display);
			});
		}
		else {
			alert("无法加载数据库列表！");
		}
	});
});

// 数据库下拉列表改变事件
function databaseOnChange(obj) {
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	database_index = index - 1;
	onChange();
}

// 图表类型下拉列表改变事件
function chartOnChange(obj) {
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	chart_type = value;
	if (chart_type == "danmaku_rank" || chart_type == "danmaku_dynamic_rank") {
		$("#combination_selector").removeAttr("hidden");
	}
	else {
		$("#combination_selector").attr("hidden", "hidden");
	}
	if (chart_type == "medal" || chart_type == "medal_level" || chart_type == "level") {
		$("#source_selector").removeAttr("hidden");
	}
	else {
		$("#source_selector").attr("hidden", "hidden");
	}
	if (chart_type == "medal" || chart_type == "medal_level" || chart_type == "level" || chart_type == "followers" || chart_type == "popularity") {
		$("#div_width").attr("hidden", "hidden");
	}
	else {
		$("#div_width").removeAttr("hidden");
	}
	if (chart_type == "danmaku_dynamic_rank") {
		alert("提示：请和见齐的数据可视化项目配套使用，点击“导出CSV”可生成所用数据。建议选择合并后的弹幕。");
	}
	onChange();
}

// 图表改变事件
function onChange() {
	if (database_index == -1 || chart_type == "none" || chart_type == "danmaku_dynamic_rank") {
		return;
	}
	// 以下为无记录的数据
	if (source == "gifts" && (chart_type == "medal" || chart_type == "level")) {
		alert("数据表中没有记录");
		return;
	}
	if (source == "welcome" && chart_type == "level") {
		alert("数据表中没有记录");
		return;
	}
	setEnabled(false);
	var url;
	if (chart_type == "danmaku_sum" || chart_type == "danmaku_rank") {
		url = `getData?database=${database_index}&chart=${chart_type}&combined=${request_combined}`
	}
	else if (chart_type == "medal" || chart_type == "medal_level" || chart_type == "level") {
		url = `getData?database=${database_index}&chart=${chart_type}&source=${source}`
	}
	else {
		url = `getData?database=${database_index}&chart=${chart_type}`
	}
	// 向服务器请求数据
	$.get(url, function (response, status) {
		if (status == "success") {
			if (response.code == 0) {
				data = response.data;
				if (data.length == 0 || (data.danmaku != undefined && data.danmaku.length == 0)) {
					alert("数据表中没有记录");
					setEnabled(true);
				}
				else {
					update(true);
				}
			}
			else if (response.code == -1) {
				alert("请求不合法");
				setEnabled(true);
			}
			else if (response.code == -2) {
				alert("数据表不存在或格式异常");
				setEnabled(true);
			}
		}
		else {
			alert("无法加载数据！");
			setEnabled(true);
		}
	});
}

// 设置控件能否交互
function setEnabled(boo) {
	$("#database_selector").attr("disabled", !boo);
	$("#chart_selector").attr("disabled", !boo);
	$("#width").attr("disabled", !boo);
	$("#combination_selector").attr("disabled", !boo);
	$("#source_selector").attr("disabled", !boo);
	$("#export").attr("disabled", !boo);
}

// 更新ECharts
function update(doDispose/* 是否重新创建ECharts */) {
	if (echart != undefined && doDispose) {
		echart.dispose();
	}
	if (chart_type == "gifts" || chart_type == "welcome" || chart_type == "popularity" || chart_type == "followers" || chart_type == "superchat" || chart_type == "new_guards" || chart_type == "events" || chart_type == "entry_effect" || chart_type == "danmaku_sum") {
		var yAxisName;
		var seriesName;
		if (chart_type == "gifts") {
			name = "送礼数量折线图";
			yAxisName = "件/秒";
			seriesName = "送礼数量（件/秒）";
			final_data = generateData(true);
		}
		else if (chart_type == "welcome") {
			name = "观众入场折线图";
			yAxisName = "人/秒";
			seriesName = "入场数量（人/秒）";
			final_data = generateData(true);
		}
		else if (chart_type == "popularity") {
			name = "人气变化折线图";
			yAxisName = "人气";
			seriesName = "人气";
			final_data = data;
		}
		else if (chart_type == "followers") {
			name = "粉丝数变化折线图";
			yAxisName = "粉丝数";
			seriesName = "粉丝数";
			final_data = data;
		}
		else if (chart_type == "superchat") {
			name = "醒目留言折线图";
			yAxisName = "数量";
			seriesName = "醒目留言数量";
			final_data = generateData(false);
		}
		else if (chart_type == "new_guards") {
			name = "购买舰长折线图";
			yAxisName = "舰长人数";
			seriesName = "舰长人数";
			final_data = generateData(false);
		}
		else if (chart_type == "events") {
			name = "直播事件折线图";
			yAxisName = "个/秒";
			seriesName = "事件数量（个/秒）";
			final_data = generateData(true);
		}
		else if (chart_type == "entry_effect") {
			name = "入场效果折线图";
			yAxisName = "次数";
			seriesName = "入场效果次数";
			final_data = generateData(false);
		}
		else if (chart_type == "danmaku_sum") {
			name = "弹幕数量折线图（合计）";
			yAxisName = "条/秒";
			seriesName = "发送速率（条/秒）";
			final_data = generateData(true);
		}
		if (final_data.length == 0) {
			echart = echarts.init(document.getElementById('main'));
			echart.setOption(option);
			return;
		}
		option = {
			dataset: {
				dimensions: ["num", "time"],
				source: final_data
			},
			title: {
				left: 'center',
				textStyle: {
					fontSize: 26
				},
				text: name
			},
			xAxis: {
				type: "time",
				axisPointer: {
					show: true
				},
				axisLabel: {
					fontSize: 14
				}
			},
			tooltip: {
				show: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: {
						yAxisIndex: "none"
					},
					magicType: {
						type: ["line", "bar"],
					},
					saveAsImage: {},
					restore: {}
				}
			},
			yAxis: chart_type == "followers" ? {
				name: yAxisName,
				min: "dataMin",
				max: "dataMax",
				nameTextStyle: {
					fontSize: 15
				},
				axisLabel: {
					fontSize: 14
				}
			} : {
				name: yAxisName,
				nameTextStyle: {
					fontSize: 15
				},
				axisLabel: {
					fontSize: 14
				}
			},
			dataZoom: [
				{
					type: "inside"
				},
				{
					type: "slider"
				}
			],
			series: [
				{
					name: seriesName,
					type: "line",
					encode: {
						x: "time",
						y: "num"
					},
					symbol: "none"
				}
			]
		}
	}
	else if (chart_type == "danmaku_rank") {
		var category_num = data.rank.length;
		var start_time = data.danmaku[0].time;
		var end_time = data.danmaku[data.danmaku.length - 1].time;
		var cursor = start_time;
		var export_data = [];
		var records = [];
		for (var j = 0; j < category_num; j++) {
			export_data.push([]);
			records.push(0);
		}
		var i = 0;
		while (cursor <= end_time) {
			for (; i < data.danmaku.length; i++) {
				if (data.danmaku[i].time < cursor + width * 1000) {
					for (var j = 0; j < data.rank.length; j++) {
						if (data.rank[j].text == data.danmaku[i].text) {
							records[j] += 1;
							break;
						}
					}
				}
				else {
					break;
				}
			}
			for (var j = 0; j < data.rank.length; j++) {
				export_data[j].push([cursor, Math.round((records[j] / width) * 10000) / 10000]);
				records[j] = 0;
			}
			cursor += width * 1000;
		}
		final_data = export_data;
		var series = [];
		var string = "{";
		danmaku_legend = ["time"];
		for (var j = 0; j < data.rank.length; j++) {
			series.push({
				name: data.rank[j].text,
				type: "line",
				data: export_data[j],
				symbol: "none"
			});
			danmaku_legend.push(data.rank[j].text);
			var text = data.rank[j].text.replace(/'/g, "\\'");
			if (j != data.rank.length - 1) {
				if (j < 9) {
					string += `'${text}':true,`;
				}
				else {
					string += `'${text}':false,`;
				}
			}
			else {
				if (j < 9) {
					string += `'${text}':true`;
				}
				else {
					string += `'${text}':false`;
				}
			}
		}
		string += "}";
		var selected = eval("(" + string + ")");
		name = "弹幕数量折线图（排行）"
		option = {
			title: {
				left: 'center',
				textStyle: {
					fontSize: 26
				},
				text: name
			},
			xAxis: {
				type: "time",
				axisPointer: {
					show: true
				},
				axisLabel: {
					fontSize: 14
				}
			},
			tooltip: {
				show: true
			},
			toolbox: {
				show: true,
				left: "75%",
				top: "top",
				feature: {
					dataZoom: {
						yAxisIndex: "none"
					},
					saveAsImage: {},
					restore: {}
				}
			},
			yAxis: {
				type: "value",
				name: "条/秒",
				nameTextStyle: {
					fontSize: 15
				},
				axisLabel: {
					fontSize: 14
				}
			},
			dataZoom: [
				{
					type: "inside"
				},
				{
					type: "slider"
				}
			],
			series: series,
			legend: {
				type: "scroll",
				orient: "vertical",
				left: "right",
				top: "middle",
				selected: selected,
				selector: true
			},
			grid: {
				left: "8%",
				right: "18%"
			}
		}
	}
	else if (chart_type == "medal" || chart_type == "medal_level" || chart_type == "level") {
		var legendData = [];
		var seriesData = [];
		if (chart_type == "medal") {
			for (var i = 0; i < data.length; i++) {
				var text;
				if (data[i].medal_name == "NO MEDAL OR INVALID ANCHOR") {
					text = "（无勋章）"
				}
				else if (data[i].anchor_name == "") {
					text = data[i].medal_name;
				}
				else {
					text = `${data[i].medal_name}（${data[i].anchor_name}）`;
				}
				legendData.push(text);
				seriesData.push({
					name: text,
					value: data[i].num
				});
			}
		}
		else {
			for (var i = 0; i < data.length; i++) {
				legendData.push(data[i].level + "");
				seriesData.push({
					name: data[i].level + "",
					value: data[i].num
				});
			}
		}
		final_data = seriesData;
		if (chart_type == "medal") {
			name = "粉丝勋章分布";
		}
		else if (chart_type == "medal_level") {
			name = "粉丝勋章等级分布";
		}
		else {
			name = "直播间等级分布";
		}
		option = {
			title: {
				left: 'center',
				textStyle: {
					fontSize: 26
				},
				text: name
			},
			tooltip: {
				show: true,
				top: "top"
			},
			toolbox: {
				show: true,
				left: "85%",
				feature: {
					saveAsImage: {}
				}
			},
			series: [
				{
					type: "pie",
					radius: "55%",
					center: ["45%", "50%"],
					data: seriesData,
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						}
					}
				}
			],
			legend: {
				type: 'scroll',
				orient: 'vertical',
				left: "right",
				top: "middle",
				data: legendData,
				selector: true
			}
		}
	}
	if (doDispose) {
		echart = echarts.init(document.getElementById('main'));
	}
	echart.setOption(option);
	setEnabled(true);
}

// 滑动条改变
function onWidthInput() {
	width = convert(document.getElementById("width").value);
	if (width < 300) {
		$("#width_label").text(`${width}秒`);
	}
	else if (width < 7200) {
		$("#width_label").text(`${width / 60}分钟`);
	}
	else {
		$("#width_label").text(`${width / 3600}小时`);
	}
}

// 滑动条改变
function onWidthChange() {
	update(false);
}

function combinationOnChange(obj) {
	var index = obj.selectedIndex;
	if (index == 0) {
		request_combined = false;
	}
	else {
		request_combined = true;
	}
	onChange();
}

function sourceOnChange(obj) {
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	source = value;
	onChange();
}

// 将滑动条的值转变为时间粒度
function convert(value) {
	/*
	 * 1-30 每单位增减1秒，30对应30秒 y=x
	 * 31-45 每单位增减2秒，45对应60秒 y=30+(x-30)*2
	 * 46-65 每单位增减3秒，65对应120秒 y=60+(x-45)*3
	 * 66-77 每单位增减5秒，77对应180秒 y=120+(x-65)*5
	 * 78-89 每单位增减10秒，89对应300秒 y=180+(x-77)*10
	 * 90-99 每单位增减30秒，99对应600秒 y=300+(x-89)*30
	 * 100-119 每单位增减1分钟，119对应30分钟 y=600+(x-99)*60
	 * 120-128 每单位增减10分钟，128对应2小时 y=1800+(x-119)*600
	 * 129-150 每单位增减1小时，150对应24小时 y=7200+(x-128)*3600
	 */
	if (value < 31) {
		return value;
	}
	else if (value < 46) {
		return 30 + (value - 30) * 2
	}
	else if (value < 66) {
		return 60 + (value - 45) * 3
	}
	else if (value < 78) {
		return 120 + (value - 65) * 5
	}
	else if (value < 90) {
		return 180 + (value - 77) * 10
	}
	else if (value < 100) {
		return 300 + (value - 89) * 30
	}
	else if (value < 120) {
		return 600 + (value - 99) * 60
	}
	else if (value < 129) {
		return 1800 + (value - 119) * 600
	}
	else {
		return 7200 + (value - 128) * 3600
	}
}

// 根据时间粒度生成数据
function generateData(flag/* 是否需要转换成每秒的数量 */) {
	// 每组数据包含开始时刻，不包含结束时刻
	var start_time = data[0].time;
	var end_time = data[data.length - 1].time;
	var cursor = start_time;
	var export_data = [];
	var i = 0;
	while (cursor <= end_time) {
		var total_num = 0;
		for (; i < data.length; i++) {
			if (data[i].time < cursor + width * 1000) {
				total_num += data[i].num;
			}
			else {
				break;
			}
		}
		if (flag) {
			export_data.push({
				num: Math.round((total_num / width) * 10000) / 10000,
				time: cursor
			});
		}
		else {
			export_data.push({
				num: total_num,
				time: cursor
			});
		}
		cursor += width * 1000;
	}
	return export_data;
}

// “导出CSV”按钮的点击事件
function exportOnClick() {
	if (database_index == -1) {
		alert("未选中数据库");
		return;
	}
	var exportData = [];
	if (chart_type == "gifts" || chart_type == "welcome" || chart_type == "popularity" || chart_type == "followers" || chart_type == "superchat" || chart_type == "new_guards" || chart_type == "events" || chart_type == "entry_effect" || chart_type == "danmaku_sum") {
		final_data.forEach(function (element) {
			exportData.push({
				time: formatDate(element.time),
				num: element.num
			});
		});
		var file = new CSV(exportData, { header: true }).encode();
		createAndDownloadFile(databases[database_index] + " - " + name + ".csv", file, true);
	}
	else if (chart_type == "medal" || chart_type == "medal_level" || chart_type == "level") {
		exportData = final_data;
		var file = new CSV(exportData, { header: true }).encode();
		createAndDownloadFile(databases[database_index] + " - " + name + ".csv", file, true);
	}
	else if (chart_type == "danmaku_rank") {
		for (var i = 0; i < final_data[0].length; i++) {
			exportData.push([formatDate(final_data[0][i][0])]);
		}
		for (var i = 1; i < danmaku_legend.length; i++) {
			for (var j = 0; j < final_data[0].length; j++) {
				exportData[j].push(final_data[i - 1][j][1]);
			}
		}
		var file = new CSV(exportData, { header: danmaku_legend }).encode();
		createAndDownloadFile(databases[database_index] + " - " + name + ".csv", file, true);
	}
	else if (chart_type == "danmaku_dynamic_rank") {
		setEnabled(false);
		var url = `getData?database=${database_index}&chart=${chart_type}&combined=${request_combined}`
		$.get(url, function (response, status) {
			if (status == "success") {
				if (response.code == 0) {
					data = response.data;
					if (data.length == 0 || (data.danmaku != undefined && data.danmaku.length == 0)) {
						alert("数据表中没有记录");
						setEnabled(true);
					}
					else {
						var start_time = data[0].time;
						var end_time = data[data.length - 1].time;
						var cursor = start_time;
						var i = 0;
						var records = [];
						while (cursor <= end_time) {
							label: for (; i < data.length; i++) {
								if (data[i].time < cursor + width * 1000) {
									for (var j = 0; j < records.length; j++) {
										if (records[j].text == data[i].text) {
											records[j].num++;
											break label;
										}
									}
									records.push({
										text: data[i].text,
										num: 1
									});
								}
								else {
									break label;
								}
							}
							records.forEach(function (element) {
								exportData.push([element.text, formatDate(cursor), element.num]);
							});
							records = [];
							cursor += width * 1000;
						}
						var file = new CSV(exportData, { header: ["name", "date", "value"] }).encode();
						createAndDownloadFile(databases[database_index] + " - " + "弹幕数量动态排行" + ".csv", file, false);
						setEnabled(true);
					}
				}
				else if (response.code == -1) {
					alert("请求不合法");
					setEnabled(true);
				}
				else if (response.code == -2) {
					alert("数据表不存在或格式异常");
					setEnabled(true);
				}
			}
			else {
				alert("无法加载数据！");
				setEnabled(true);
			}
		});
	}
	else {
		alert("未选中图表");
	}
}

// 下载文件
function createAndDownloadFile(fileName, content, write_bom/* 是否写入BOM */) {
	if (write_bom) {
		// 由于微软的操作，需要写入3字节的BOM才会按照UTF-8编码读取，否则中文乱码
		var arrayBuffer = new ArrayBuffer(8);
		new Uint8Array(arrayBuffer, 0, 1)[0] = 0xEF;
		new Uint8Array(arrayBuffer, 1, 1)[0] = 0xBB;
		new Uint8Array(arrayBuffer, 2, 1)[0] = 0xBF;
		var aTag = document.createElement('a');
		var blob = new Blob([arrayBuffer, content]);
		aTag.download = fileName;
		aTag.href = URL.createObjectURL(blob);
		aTag.click();
		URL.revokeObjectURL(blob);
	}
	else {
		var aTag = document.createElement('a');
		var blob = new Blob([content]);
		aTag.download = fileName;
		aTag.href = URL.createObjectURL(blob);
		aTag.click();
		URL.revokeObjectURL(blob);
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
