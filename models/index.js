/*
 *模型总控
*/
var Db = require('./db').Db;

//model list
require('./user');
require('./category');
require('./lib');
require('./tag');
require('./lib_tag');
require('./lib_user');
require('./lib_use');
require('./res');

exports.User = Db.model('User');
exports.Category = Db.model('Category');
exports.Lib = Db.model('Lib');
exports.Tag = Db.model('Tag');
exports.LibTag = Db.model('LibTag');
exports.LibUser = Db.model('LibUser');
exports.LibUse = Db.model('LibUse');
exports.Res = Db.model('Res');