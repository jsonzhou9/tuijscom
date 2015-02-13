/*
 *用户模型，功能扩展
*/
var models = require('../models');
var User = models.User;

/**
 * 根据登录名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} loginName 登录名为邮箱或用户名
 * @param {Function} callback 回调函数
 */
exports.getUserByLoginName = function (loginName, callback) {
	User.findOne({'$or': [{'username': loginName}, {'email': loginName}]}, callback);
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
	User.findOne({_id: id}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query, opt, callback) {
	User.find(query, null, opt, callback);
};

/**
 * 添加一个新用户
 */
exports.newAndSave = function (email, username, password, callback) {
	var user = new User();
	user.email = email;
	user.username = username;
	user.password = password;
	user.save(callback);
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
	User.count(query, callback);
};

/**
 * 根据用户id查找,并更新
 */
exports.findByIdAndUpdate = function (id, update, callback) {
	User.findByIdAndUpdate(id, update , callback);
};

/**
 * 根据用户id查找
 */
exports.findById = function (id, callback) {
	User.findById(id, callback);
};

/**
 * 根据用户名查找
 */
exports.findByName = function (name, callback) {
	User.findOne({username : name}, callback);
};