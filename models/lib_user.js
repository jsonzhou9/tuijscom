/*
 *用户收藏与类库对应模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构
var ObjectId = Schema.ObjectId;

var LibUserSchema = new Schema({
	lib_id: { type: ObjectId },
	user_id: { type: ObjectId }
}, {collection:'lib_user'});

mongoose.model('LibUser', LibUserSchema);