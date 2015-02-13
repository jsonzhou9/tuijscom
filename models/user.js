/*
 *用户模型,相当于一个表名
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //相当表结构

var UserSchema = new Schema({
	username: { type: String, index: true },
	password: { type: String },
	email: { type: String, unique: true },
	score: { type: Number, 'default': 0 },
	topic_count: { type: Number, 'default': 0 }, //推荐类库个数
	create_at: { type: Date, 'default': Date.now }, //创建时间
	email_active: { type: Boolean, 'default': false }, //邮箱是否激活
	active: { type: Boolean, 'default': true } //账号是否正常
}, {collection:'user'});

mongoose.model('User', UserSchema); //相当于一个表