/*
 *栏目模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构

var CategorySchema = new Schema({
	name_en : { type: String, index: true },
	name_cn: { type: String, index: true },
	type: { type: Number, 'default': 1 },
	isdel: { type: Boolean, 'default': false } //软删除标识位
}, {collection:'category'});

mongoose.model('Category', CategorySchema); //相当于一个表