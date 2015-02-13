/*
 *标签与类库对应模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构
var ObjectId = Schema.ObjectId;

var LibTagSchema = new Schema({
	lib_id: { type: ObjectId },
	tag_id: { type: ObjectId }
}, {collection:'lib_tag'});

mongoose.model('LibTag', LibTagSchema);