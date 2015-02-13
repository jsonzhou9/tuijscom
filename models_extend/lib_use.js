/*
 *‘已使用’和类库对应模型，功能扩展
*/
var models = require('../models');
var LibUse = models.LibUse;

/**
 * 添加一个新记录
 */
exports.newAndSave = function (lib_id, user_ip, callback) {
	var libuse = new LibUse();
	libuse.lib_id = lib_id;
	libuse.user_ip = user_ip;
	libuse.save(callback);
};

/**
 * 根据libid删除
 */
exports.findByLibRemove = function (lib_id, callback) {
	LibUse.remove({lib_id: lib_id}, callback);
};

/**
 * 根据libid查找
 */
exports.getByLibAndIp = function (lib_id, user_ip, callback) {
	LibUse.find({lib_id: lib_id, user_ip: user_ip}, callback);
};

/**
 * 查询数量
 */
exports.getCountByQuery = function (query, callback) {
	LibUse.count(query, callback);
};