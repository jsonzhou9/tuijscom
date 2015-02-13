/*
 *类库和标签对应模型，功能扩展
*/
var models = require('../models');
var LibUser = models.LibUser;

/**
 * 添加一个新记录
 */
exports.newAndSave = function (lib_id, user_id, callback) {
	var libuser = new LibUser();
	libuser.lib_id = lib_id;
	libuser.user_id = user_id;
	libuser.save(callback);
};

/**
 * 根据libid删除
 */
exports.findByLibRemove = function (lib_id, callback) {
	LibUser.remove({lib_id: lib_id}, callback);
};

/**
 * 根据libid和userid删除
 */
exports.findByLibAndUserRemove = function (lib_id, user_id, callback) {
	LibUser.remove({lib_id: lib_id,user_id:user_id}, callback);
};

/**
 * 根据libid和userid查找
 */
exports.getByLibAndUser = function (lib_id, user_id, callback) {
	LibUser.findOne({lib_id: lib_id,user_id:user_id}, callback);
};

/**
 * 根据libid查找
 */
exports.getByLibId = function (id, callback) {
	LibUser.find({lib_id: id}, callback);
};

/**
 * 根据userid查找
 */
exports.getByUserId = function (id, callback) {
	LibUser.find({user_id: id}, callback);
};

/**
 * 根据查询条件进行统计
 */
exports.getCountByQuery = function (query, callback) {
	LibUser.count(query, callback);
};

/**
 * 根据关键字，获取一组记录
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getLibByQuery = function (query, opt, callback) {
	LibUser.find(query, null, opt, callback);
};