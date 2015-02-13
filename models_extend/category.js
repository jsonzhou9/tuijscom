/*
 *栏目模型，功能扩展
*/
var models = require('../models');
var Category = models.Category;

/**
 * 根据关键字，获取一组记录
 * Callback:
 * - err, 数据库异常
 * - columns, 记录列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getCategoryByQuery = function (query, opt, callback) {
	Category.find(query, null, opt, callback);
};

/**
 * 根据栏目id查找
 * Callback:
 * - err, 数据库异常
 * - column, 栏目
 */
exports.getCategoryById = function (id, callback) {
	Category.findById(id, callback);
};

/**
 * 根据栏目id查找,并更新
 */
exports.findByIdAndUpdate = function (id, update, callback) {
	Category.findByIdAndUpdate(id, update , callback);
};

/**
 * 根据栏目id查找,并删除
 */
exports.findByIdAndRemove = function (id, callback) {
	Category.findByIdAndRemove(id, callback);
};

/**
 * 添加一个新栏目
 */
exports.newAndSave = function (type,name_cn, name_en, callback) {
	var category = new Category();
	category.name_cn = name_cn;
	category.name_en = name_en;
	category.type = type;
	category.save(callback);
};

/**
 * 根据栏目英文查找
 */
exports.findByEnName = function (name, callback) {
	Category.findOne({name_en : name} , callback);
};