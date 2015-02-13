/*
 *类库模型，功能扩展
*/
var models = require('../models');
var Lib = models.Lib;

/**
 * 根据名称查找类库
 */
exports.getLibByName = function (name, callback) {
	Lib.findOne({libname : name}, callback);
};

/**
 * 添加一个新类库
 */
exports.newAndSave = function (category_id, top, doc, github, homepage, content, libname, title, author_id, isok, thumb, callback) {
	var lib = new Lib();
	lib.category_id = category_id;
	lib.top = top;
	lib.doc = doc;
	lib.github = github;
	lib.homepage = homepage;
	lib.content = content;
	lib.libname = libname;
	lib.title = title;
	lib.author_id = author_id;
	if(isok){
		lib.isok = isok;
	}
	lib.thumb = thumb;
	lib.save(callback);
};

/**
 * 根据id查找,并删除
 */
exports.findByIdAndRemove = function (id, callback) {
	Lib.remove({_id:id} , callback);
};

/**
 * 根据id查找,并更新
 */
exports.findByIdAndUpdate = function (id, update, callback) {
	Lib.findByIdAndUpdate(id, update , callback);
};

/**
 * 根据id查找
 */
exports.getLibById = function (id, callback) {
	Lib.findOne({_id: id}, callback);
};

/**
 * 根据关键字，获取一组记录
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getLibByQuery = function (query, opt, callback) {
	Lib.find(query, null, opt, callback);
};
exports.getLibFieldByQuery = function (query, field, opt, callback) {
	Lib.find(query, field, opt, callback);
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
	Lib.count(query, callback);
};