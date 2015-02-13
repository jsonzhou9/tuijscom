/*
 *资源模型
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ResSchema = new Schema({
	key : { type: String },
	create_at: { type: Date, 'default': Date.now }
}, {collection:'res'});

mongoose.model('Res', ResSchema);