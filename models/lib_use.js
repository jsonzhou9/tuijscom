/*
 *“已使用”功能的用户IP与类库对应模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构
var ObjectId = Schema.ObjectId;

var LibUseSchema = new Schema({
	lib_id: { type: ObjectId },
	user_ip: { type: String }
}, {collection:'lib_use'});

mongoose.model('LibUse', LibUseSchema);