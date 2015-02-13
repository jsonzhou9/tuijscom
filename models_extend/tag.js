/*
 *标签模型，功能扩展
*/
var models = require('../models');
var Tag = models.Tag;

/**
 * 根据名称查找标签
 */
exports.getTagByName = function (name, callback) {
	Tag.findOne({name : name}, callback);
};

/**
 * 添加一个新标签
 */
exports.newAndSave = function (name, callback) {
	var tag = new Tag();
	tag.name = name;
	tag.save(callback);
};

/**
 * 根据id查找
 */
exports.getTagById = function (id, callback) {
	Tag.findOne({_id: id}, callback);
};

/**
 * 根据名字查找
 */
exports.getTagByName = function (name, callback) {
	Tag.findOne({name: name}, callback);
};

/**
 * 所有tag
 */
exports.getAllTag= function (callback) {
	Tag.find({}, callback);
};

/**
 * 根据关键字，获取一组标签
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getTagByQuery = function (query, opt, callback) {
	Tag.find(query, null, opt, callback);
};