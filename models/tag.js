/*
 *标签模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
	name : { type: String },
	topic_count : { type: Number, 'default': 0 }
}, {collection:'tag'});

mongoose.model('Tag', TagSchema);