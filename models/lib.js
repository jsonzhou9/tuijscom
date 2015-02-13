/*
 *类库模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构
var ObjectId = Schema.ObjectId;

var LibSchema = new Schema({
	libname: { type: String },
	title: { type: String },
	content: { type: String },
	author_id: { type: ObjectId },
	top: { type: Boolean, 'default': false }, //推荐或置顶
	visit_count: { type: Number, 'default': 0 }, //访问量
	fav_count: { type: Number, 'default': 0 }, //喜爱量或已使用
	create_at: { type: Date, 'default': Date.now },
	update_at: { type: Date, 'default': Date.now },
	isok: { type: Boolean, 'default': false }, //是否审核通过
	category_id: { type: ObjectId }, //分类ID
	thumb: { type: String },
	homepage: { type: String },
	doc: { type: String },
	github : { type: String }
}, {collection:'lib'});

mongoose.model('Lib', LibSchema); //相当于一个表