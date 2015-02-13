/*
 *类库和标签对应模型，功能扩展
*/
var models = require('../models');
var LibTag = models.LibTag;

/**
 * 添加一个新记录
 */
exports.newAndSave = function (lib_id, tag_id, callback) {
	var libtag = new LibTag();
	libtag.lib_id = lib_id;
	libtag.tag_id = tag_id;
	libtag.save(callback);
};

/**
 * 根据libid删除
 */
exports.findByLibRemove = function (lib_id, callback) {
	LibTag.remove({lib_id: lib_id}, callback);
};

/**
 * 根据libid查找
 */
exports.getByLibId = function (id, callback) {
	LibTag.find({lib_id: id}, callback);
};

/**
 * 根据tagid查找
 */
exports.getByTagId = function (id, callback) {
	LibTag.find({tag_id: id}, callback);
};

/**
 * 根据关键词查找
 */
exports.getByQuery = function (query, opt, callback) {
	LibTag.find(query, null, opt, callback);
};

/**
 * 获取关键词能搜索到的数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
	LibTag.count(query, callback);
};