/*
 *资源模型，功能扩展
*/
var models = require('../models');
var Res = models.Res;

/**
 * 添加一个新标签
 */
exports.newAndSave = function (key, callback) {
	var res = new Res();
	res.key = key;
	res.save(callback);
};

/**
 * 根据id查找
 */
exports.getResById = function (id, callback) {
	Res.findOne({_id: id}, callback);
};

/**
 * 根据关键字，获取一组资源
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getResByQuery = function (query, opt, callback) {
	Res.find(query, null, opt, callback);
};